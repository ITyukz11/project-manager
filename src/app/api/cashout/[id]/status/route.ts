import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ADMINROLES } from "@/lib/types/role";
import { pusher } from "@/lib/pusher";
import { emitCashoutUpdated } from "@/actions/server/emitCashoutUpdated";
import { CashoutStatus } from "@prisma/client";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const id = (await params).id;
  const session = await getServerSession(authOptions);

  const formData = await req.formData();
  const status = formData.get("status") as CashoutStatus;

  if (
    !session?.user ||
    (session.user.role !== ADMINROLES.ADMIN &&
      session.user.role !== ADMINROLES.SUPERADMIN &&
      session.user.role !== ADMINROLES.ACCOUNTING)
  ) {
    return NextResponse.json(
      { error: "Unauthorized only ADMINS and ACCOUNTING can update status" },
      { status: 403 },
    );
  }

  if (!status) {
    return NextResponse.json({ error: "Missing status" }, { status: 400 });
  }

  try {
    // 1. Update the cashout status (get casinoGroup for channel)
    const cashout = await prisma.cashout.update({
      where: { id },
      data: { status },
      include: { casinoGroup: true },
    });

    // 2. Log this status change in CashoutLogs
    await prisma.cashoutLogs.create({
      data: {
        action: status,
        cashoutId: id,
        performedById: session.user.id,
      },
    });

    // 3. Get updated pending count for this casinoGroup
    const pendingCount = await prisma.cashout.count({
      where: {
        status: "PENDING",
        casinoGroupId: cashout.casinoGroupId,
      },
    });

    // 4. Update transaction status in TransactionRequest table if linked
    if (cashout.transactionRequestId) {
      const transactionStatus = status === "COMPLETED" ? "APPROVED" : status;
      await prisma.transactionRequest.update({
        where: { id: cashout.transactionRequestId },
        data: { status: transactionStatus },
      });
    }
    //Check if it is a commission cashout and update transaction status accordingly
    if (cashout.commissionId) {
      const transactionStatus = status === "COMPLETED" ? "APPROVED" : status;
      await prisma.commission.update({
        where: { id: cashout.commissionId },
        data: { status: transactionStatus },
      });

      try {
        const QBET88_BASE = process.env.QBET88_BASE_URL;
        const qbetPatchRes = await fetch(
          `${QBET88_BASE}/api/nxtlink/commission/${cashout.commissionId}/status`,
          {
            method: "PATCH",
            body: JSON.stringify({ status: transactionStatus }),
            headers: {
              "Content-Type": "application/json",
            },
          },
        );

        console.log("qbet88 PATCH response status:", qbetPatchRes.status);

        if (!qbetPatchRes.ok) {
          const errMsg = await qbetPatchRes.text();
          console.error(
            "Failed to update commission status on qbet88:",
            errMsg,
          );
          // Include warning in response but do not fail the main transaction
          return NextResponse.json({
            success: true,
            cashout: cashout,
            warning: "Local update succeeded but failed to update qbet88",
            qbet88Response: errMsg,
          });
        } else {
          const resData = await qbetPatchRes.json().catch(() => null);
          console.log("qbet88 PATCH success response:", resData);
        }
      } catch (syncErr) {
        console.error("Error syncing with qbet88:", syncErr);
      }
    }

    // 5. Emit Pusher event for the clients
    await pusher.trigger(
      `cashout-${cashout.casinoGroup.name.toLowerCase()}`,
      "cashout-pending-count",
      { count: pendingCount },
    );

    await emitCashoutUpdated({
      transactionId: cashout.id,
      casinoGroup: cashout.casinoGroup.name.toLowerCase(),
      action: "UPDATED",
    });

    return NextResponse.json({ success: true, cashout });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "An error occurred" },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ADMINROLES } from "@/lib/types/role";
import { pusher } from "@/lib/pusher";
import { emitCashoutUpdated } from "@/actions/server/emitCashoutUpdated";
import { CashoutStatus } from "@prisma/client";
import { createTransaction } from "@/lib/qbet88/createTransaction";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = (await params).id;
  const session = await getServerSession(authOptions);

  const formData = await req.formData();
  const status = formData.get("status") as CashoutStatus;
  const externalUserId = formData.get("externalUserId") as string;

  if (
    !session?.user ||
    (session.user.role !== ADMINROLES.ADMIN &&
      session.user.role !== ADMINROLES.SUPERADMIN &&
      session.user.role !== ADMINROLES.ACCOUNTING)
  ) {
    return NextResponse.json(
      { error: "Unauthorized only ADMINS and ACCOUNTING can update status" },
      { status: 403 }
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

    console.log("Status:", status);
    // --- TRANSACTION LOGIC HERE ----
    // Only call the transaction API when status becomes COMPLETED (or adjust to your needs)
    if (status === "COMPLETED") {
      // Assuming cashin has fields: id, amount, and a unique txn (e.g., transactionId, ref etc)
      // Adjust field names as per your schema

      console.log("Creating transaction for cashout:", cashout);
      console.log("Status:", status);
      const transactionRes = await createTransaction({
        id: externalUserId, //cashin.id,
        txn: cashout.id, // Adjust to your transaction ref field
        type: "WITHDRAW", // Since this is a cashin
        amount: cashout.amount,
      });

      // Optionally, handle/record transactionRes in your DB, or send errors back
      if (!transactionRes.ok) {
        return NextResponse.json(
          { error: "Failed to post transaction", details: transactionRes },
          { status: 502 }
        );
      }
    }

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

    // 5. Emit Pusher event for the clients
    await pusher.trigger(
      `cashout-${cashout.casinoGroup.name.toLowerCase()}`,
      "cashout-pending-count",
      { count: pendingCount }
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
      { status: 500 }
    );
  }
}

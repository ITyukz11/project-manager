import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ADMINROLES } from "@/lib/types/role";
import { pusher } from "@/lib/pusher";
import { emitCommissionUpdated } from "@/actions/server/emitCommissionUpdated";
import { CommissionStatus } from "@prisma/client";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const id = (await params).id;
  const session = await getServerSession(authOptions);

  const formData = await req.formData();
  const status = formData.get("status") as CommissionStatus;

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
    // 1. Update the commission status (get casinoGroup for channel)
    const commission = await prisma.commission.update({
      where: { id },
      data: { status },
      include: { casinoGroup: true },
    });

    // 2. Log this status change in CommissionLogs
    await prisma.commissionLogs.create({
      data: {
        action: status,
        commissionId: id,
        performedById: session.user.id,
      },
    });

    // 3. Get updated pending count for this casinoGroup
    const pendingCount = await prisma.commission.count({
      where: {
        status: "PENDING",
        casinoGroupId: commission.casinoGroupId,
      },
    });

    // 4. Update transaction status in TransactionRequest table if linked
    if (commission.transactionRequestId) {
      const transactionStatus = status === "COMPLETED" ? "APPROVED" : status;
      await prisma.transactionRequest.update({
        where: { id: commission.transactionRequestId },
        data: { status: transactionStatus },
      });
    }

    // 5. Emit Pusher event for the clients
    await pusher.trigger(
      `commission-${commission.casinoGroup.name.toLowerCase()}`,
      "commission-pending-count",
      { count: pendingCount },
    );

    await emitCommissionUpdated({
      transactionId: commission.id,
      casinoGroup: commission.casinoGroup.name.toLowerCase(),
      action: "UPDATED",
    });

    // 6. PATCH to qbet88.vip's commission status API
    // Adjust BASE_URL if needed (be careful with localhost/dev/prod environment)
    const QBET88_BASE = process.env.QBET88_BASE_URL;
    // You may need your local/prod base (http://localhost:3000, etc.) for development

    const qbetPatchRes = await fetch(
      `${QBET88_BASE}/api/nxtlink/commission/${commission.id}/status`,
      {
        method: "PATCH",
        // use same cookie/session headers if authentication is required by qbet88.vercel
        // (for now, send as formData for compatibility)
        body: JSON.stringify({ status }),
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
    // Optionally, you can check for qbetPatchRes.ok and log or handle errors for the sync

    if (!qbetPatchRes.ok) {
      const errMsg = await qbetPatchRes.text();
      // Optionally, notify someone or log error if sync fails!
      console.error(
        "Failed to update commission status on qbet88.vercel:",
        errMsg,
      );
      // Don't fail the main request, but you can include a warning in response.
      return NextResponse.json({
        success: true,
        commission,
        warning: "Local update succeeded but failed to update qbet88.vercel",
        qbet88Response: errMsg,
      });
    }

    return NextResponse.json({ success: true, commission });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "An error occurred" },
      { status: 500 },
    );
  }
}

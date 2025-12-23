import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ADMINROLES } from "@/lib/types/role";
import { pusher } from "@/lib/pusher";
import { emitCashinUpdated } from "@/actions/server/emitCashinUpdated";
import { CashinStatus } from "@prisma/client";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = (await params).id;
  const session = await getServerSession(authOptions);
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

  const { status } = await req.json();
  if (!status) {
    return NextResponse.json({ error: "Missing status" }, { status: 400 });
  }

  try {
    // 1. Update the cashin status (get casinoGroup for channel)
    const cashin = await prisma.cashin.update({
      where: { id },
      data: { status },
      include: { casinoGroup: true },
    });

    // 2. Log this status change in CashinLogs
    await prisma.cashinLogs.create({
      data: {
        action: status,
        cashinId: id,
        performedById: session.user.id,
      },
    });

    // 3. Get updated pending count for this casinoGroup
    const pendingCount = await prisma.cashin.count({
      where: {
        status: CashinStatus.ACCOMMODATING,
        casinoGroupId: cashin.casinoGroupId,
      },
    });

    // 4. Update transaction status in TransactionRequest table if linked
    if (cashin.transactionRequestId) {
      const transactionStatus = status === "COMPLETED" ? "APPROVED" : status;
      await prisma.transactionRequest.update({
        where: { id: cashin.transactionRequestId },
        data: { status: transactionStatus },
      });
    }

    // 5. Emit Pusher event for the clients
    await pusher.trigger(
      `cashin-${cashin.casinoGroup.name.toLowerCase()}`,
      "cashin-pending-count",
      { count: pendingCount }
    );

    await emitCashinUpdated({
      transactionId: cashin.id,
      casinoGroup: cashin.casinoGroup.name.toLowerCase(),
      action: "UPDATED",
    });

    return NextResponse.json({ success: true, cashin });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "An error occurred" },
      { status: 500 }
    );
  }
}

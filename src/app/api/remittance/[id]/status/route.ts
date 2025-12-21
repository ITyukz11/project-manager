import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ADMINROLES } from "@/lib/types/role";
import { pusher } from "@/lib/pusher";
import { emitRemittanceUpdated } from "@/actions/server/emitRemittanceUpdated";

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
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { status } = await req.json();
  if (!status) {
    return NextResponse.json({ error: "Missing status" }, { status: 400 });
  }

  try {
    // 1. Update the concern status (get casinoGroup for channel)
    const remittance = await prisma.remittance.update({
      where: { id },
      data: { status },
      include: { casinoGroup: true },
    });

    // 2. Log this status change in ConcernLogs
    await prisma.remittanceLogs.create({
      data: {
        action: status,
        remittanceId: id,
        performedById: session.user.id,
      },
    });

    // 3. Get updated pending count for this casinoGroup
    const pendingCount = await prisma.remittance.count({
      where: {
        status: "PENDING",
        casinoGroupId: remittance.casinoGroupId,
      },
    });

    // 4. Emit Pusher event for the clients
    await pusher.trigger(
      `remittance-${remittance.casinoGroup.name.toLowerCase()}`,
      "remittance-pending-count",
      { count: pendingCount }
    );

    await emitRemittanceUpdated({
      transactionId: remittance.id,
      casinoGroup: remittance.casinoGroup.name,
      action: "CREATED",
    });

    return NextResponse.json({ success: true, remittance });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "An error occurred" },
      { status: 500 }
    );
  }
}

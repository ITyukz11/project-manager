import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ADMINROLES } from "@/lib/types/role";
import { pusher } from "@/lib/pusher";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = (await params).id;
  const session = await getServerSession(authOptions);
  if (
    !session?.user ||
    (session.user.role !== ADMINROLES.ADMIN &&
      session.user.role !== ADMINROLES.SUPERADMIN)
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { status } = await req.json();
  if (!status) {
    return NextResponse.json({ error: "Missing status" }, { status: 400 });
  }

  try {
    // 1. Update the concern status (get casinoGroup for channel)
    const concern = await prisma.concern.update({
      where: { id },
      data: { status },
      include: { casinoGroup: true },
    });

    // 2. Log this status change in ConcernLogs
    await prisma.concernLogs.create({
      data: {
        action: status,
        concernId: id,
        performedById: session.user.id,
      },
    });

    // 3. Get updated pending count for this casinoGroup
    const pendingCount = await prisma.concern.count({
      where: {
        status: "PENDING",
        casinoGroupId: concern.casinoGroupId,
      },
    });

    // 4. Emit Pusher event for the clients
    await pusher.trigger(
      `concern-${concern.casinoGroup.name.toLowerCase()}`,
      "concern-pending-count",
      { count: pendingCount }
    );

    return NextResponse.json({ success: true, concern });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "An error occurred" },
      { status: 500 }
    );
  }
}

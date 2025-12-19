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

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { status } = await req.json();
  if (!status) {
    return NextResponse.json({ error: "Missing status" }, { status: 400 });
  }

  try {
    // 1. Fetch the concern to check the creator
    const concern = await prisma.concern.findUnique({
      where: { id },
      include: { casinoGroup: true },
    });

    if (!concern) {
      return NextResponse.json({ error: "Concern not found" }, { status: 404 });
    }

    // 2. Check authorization:  creator, admin, or superadmin
    const isCreator = concern.userId === session.user.id;
    const isAdmin = session.user.role === ADMINROLES.ADMIN;
    const isSuperAdmin = session.user.role === ADMINROLES.SUPERADMIN;

    if (!isCreator && !isAdmin && !isSuperAdmin) {
      return NextResponse.json(
        {
          error:
            "Unauthorized.  Only the creator, admins, or superadmins can update status",
        },
        { status: 403 }
      );
    }

    // 3. Update the concern status
    const updatedConcern = await prisma.concern.update({
      where: { id },
      data: { status },
      include: { casinoGroup: true },
    });

    // 4. Log this status change in ConcernLogs
    await prisma.concernLogs.create({
      data: {
        action: status,
        concernId: id,
        performedById: session.user.id,
      },
    });

    // 5. Get updated pending count for this casinoGroup
    const pendingCount = await prisma.concern.count({
      where: {
        status: "PENDING",
        casinoGroupId: updatedConcern.casinoGroupId,
      },
    });

    // 6. Emit Pusher event for the clients
    await pusher.trigger(
      `concern-${updatedConcern.casinoGroup.name.toLowerCase()}`,
      "concern-pending-count",
      { count: pendingCount }
    );

    return NextResponse.json({ success: true, concern: updatedConcern });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "An error occurred" },
      { status: 500 }
    );
  }
}

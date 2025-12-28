import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ADMINROLES } from "@/lib/types/role";
import { pusher } from "@/lib/pusher";
import { emitTaskUpdated } from "@/actions/server/emitTaskUpdated";

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
    // 1. Fetch the task to check the creator
    const task = await prisma.task.findUnique({
      where: { id },
      include: { casinoGroup: true },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // 2. Check authorization: creator, admin, or superadmin
    const isCreator = task.userId === session.user.id;
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

    // 3. Update the task status
    const updatedTask = await prisma.task.update({
      where: { id },
      data: { status },
      include: { casinoGroup: true },
    });

    // 4. Log this status change in TaskLogs
    await prisma.taskLogs.create({
      data: {
        action: status,
        taskId: id,
        performedById: session.user.id,
      },
    });

    // 5. Get updated pending count for this casinoGroup
    const pendingCount = await prisma.task.count({
      where: {
        status: "PENDING",
        casinoGroupId: updatedTask.casinoGroupId,
      },
    });

    // 6. Emit Pusher event for the clients
    await pusher.trigger(
      `task-${updatedTask.casinoGroup.name.toLowerCase()}`,
      "task-pending-count",
      { count: pendingCount }
    );

    await emitTaskUpdated({
      transactionId: task.id,
      casinoGroup: task.casinoGroup.name.toLowerCase(),
      action: "UPDATED",
    });
    return NextResponse.json({ success: true, task: updatedTask });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "An error occurred" },
      { status: 500 }
    );
  }
}

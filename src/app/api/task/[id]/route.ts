import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authentication (optional, keep for security)
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = (await params).id;
    if (!id) {
      return NextResponse.json({ error: "No ID provided" }, { status: 400 });
    }

    // Find the specific concern by primary key
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        user: true,
        attachments: true,
        taskLogs: { include: { performedBy: true } },
        taskThreads: {
          include: { author: true, attachments: true },
        },
        tagUsers: true,
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json(task);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

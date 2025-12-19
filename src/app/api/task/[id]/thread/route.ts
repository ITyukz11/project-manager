import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { put } from "@vercel/blob";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = (await params).id;

  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!id) {
      return NextResponse.json({ error: "Missing task ID" }, { status: 400 });
    }

    const formData = await req.formData();
    const message = formData.get("message");
    const attachmentFiles = formData.getAll("attachment") as File[];

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Create thread/comment
    const thread = await prisma.taskThread.create({
      data: {
        message: message.trim(),
        taskId: id,
        authorId: currentUser.id,
      },
    });

    // 🚀 Upload all files in parallel!
    const uploadPromises = attachmentFiles
      .filter((file) => file && typeof file === "object" && file.size > 0)
      .map(async (file) => {
        const blob = await put(file.name, file, {
          access: "public",
          addRandomSuffix: true,
        });
        return {
          url: blob.url,
          filename: file.name,
          mimetype: file.type || "",
        };
      });
    const attachmentData = await Promise.all(uploadPromises);

    if (attachmentData.length > 0) {
      await prisma.taskAttachment.createMany({
        data: attachmentData.map((att) => ({
          url: att.url,
          filename: att.filename,
          mimetype: att.mimetype,
          taskThreadId: thread.id,
        })),
      });
    }

    // Return thread including its attachments
    const createdThread = await prisma.taskThread.findUnique({
      where: { id: thread.id },
      include: { attachments: true, author: true },
    });

    return NextResponse.json({ success: true, thread: createdThread });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

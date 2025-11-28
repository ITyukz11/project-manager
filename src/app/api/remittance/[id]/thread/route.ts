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
      return NextResponse.json(
        { error: "Missing remittance ID" },
        { status: 400 }
      );
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

    const remittance = await prisma.remittance.findUnique({ where: { id } });
    if (!remittance) {
      return NextResponse.json(
        { error: "Remittance not found" },
        { status: 404 }
      );
    }

    // Create thread/comment
    const thread = await prisma.remittanceThread.create({
      data: {
        message: message.trim(),
        remittanceId: id,
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
      await prisma.attachment.createMany({
        data: attachmentData.map((att) => ({
          url: att.url,
          filename: att.filename,
          mimetype: att.mimetype,
          remittanceThreadId: thread.id,
        })),
      });
    }

    // Return thread including its attachments
    const createdThread = await prisma.remittanceThread.findUnique({
      where: { id: thread.id },
      include: { attachments: true, author: true },
    });

    return NextResponse.json({ success: true, thread: createdThread });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

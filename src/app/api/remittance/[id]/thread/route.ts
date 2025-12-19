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

    // Filter valid attachment files
    const validAttachments = attachmentFiles.filter(
      (file) => file && typeof file === "object" && file.size > 0
    );

    // ✅ Require either a message OR at least one attachment
    const hasMessage = message && typeof message === "string" && message.trim();
    const hasAttachments = validAttachments.length > 0;

    if (!hasMessage && !hasAttachments) {
      return NextResponse.json(
        { error: "Message or attachment is required" },
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

    // Create thread/comment with optional message
    const thread = await prisma.remittanceThread.create({
      data: {
        message: hasMessage ? (message as string).trim() : "", // ✅ Allow empty message
        remittanceId: id,
        authorId: currentUser.id,
      },
    });

    // 🚀 Upload all files in parallel!
    if (hasAttachments) {
      const uploadPromises = validAttachments.map(async (file) => {
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

      await prisma.remittanceAttachment.createMany({
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

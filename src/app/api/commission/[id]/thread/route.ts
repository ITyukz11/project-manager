import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { put } from "@vercel/blob";
import { pusher } from "@/lib/pusher"; // optional: for real-time notifications

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
        { error: "Missing cashout ID" },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const message = formData.get("message");
    const casinoGroup =
      (formData.get("casinoGroup") as string | null)?.trim() || "";
    const attachmentFiles = formData.getAll("attachment") as File[];
    const mentionsRaw = formData.get("mentions") as string | null;

    // Parse mentions safely
    let mentions: string[] = [];
    try {
      if (mentionsRaw) {
        mentions = JSON.parse(mentionsRaw);
      }
    } catch (err) {
      console.warn("Failed to parse mentions:", err);
    }

    // Validate input
    const hasMessage = message && typeof message === "string" && message.trim();
    const validAttachments = attachmentFiles.filter(
      (file) => file && typeof file === "object" && file.size > 0
    );
    const hasAttachments = validAttachments.length > 0;

    if (!hasMessage && !hasAttachments) {
      return NextResponse.json(
        { error: "Message or attachment is required" },
        { status: 400 }
      );
    }

    // Check if cashout exists
    const cashout = await prisma.cashout.findUnique({ where: { id } });
    if (!cashout) {
      return NextResponse.json({ error: "Cashout not found" }, { status: 404 });
    }

    // Create thread
    const thread = await prisma.cashoutThread.create({
      data: {
        message: hasMessage ? (message as string).trim() : "",
        cashoutId: id,
        authorId: currentUser.id,
      },
    });

    // Upload attachments in parallel
    if (hasAttachments) {
      const attachmentData = await Promise.all(
        validAttachments.map(async (file) => {
          const blob = await put(file.name, file, {
            access: "public",
            addRandomSuffix: true,
          });
          return {
            url: blob.url,
            filename: file.name,
            mimetype: file.type || "",
            cashoutThreadId: thread.id,
          };
        })
      );

      await prisma.attachment.createMany({
        data: attachmentData,
      });
    }

    // Notify mentioned users
    if (mentions.length > 0) {
      const usersToNotify = await prisma.user.findMany({
        where: { username: { in: mentions } },
        select: { id: true, username: true },
      });

      await Promise.all(
        usersToNotify.map(async (user) => {
          const notification = await prisma.notifications.create({
            data: {
              userId: user.id,
              message: `${currentUser.username} mentioned you in a cashout comment.`,
              link: `/${casinoGroup}/cash-outs/${cashout.id}`, // adjust front-end link
              type: "mention",
              actor: currentUser.username,
              subject: "Cashout Thread",
              casinoGroup: casinoGroup ?? "", // adjust if needed
              isRead: false,
            },
          });

          // Optional: real-time notification via Pusher
          await pusher.trigger(
            `user-notify-${user.id}`,
            "notifications-event",
            notification
          );
        })
      );
    }

    // Return thread including attachments
    const createdThread = await prisma.cashoutThread.findUnique({
      where: { id: thread.id },
      include: { attachments: true, author: true },
    });

    return NextResponse.json({ success: true, thread: createdThread });
  } catch (e: any) {
    console.error("Error posting cashout thread:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

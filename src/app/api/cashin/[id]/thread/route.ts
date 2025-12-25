import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { put } from "@vercel/blob";
import { pusher } from "@/lib/pusher";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = (await params).id;

  if (!id) {
    return NextResponse.json({ error: "Missing cashin ID" }, { status: 400 });
  }

  try {
    const currentUser = await getCurrentUser();
    const formData = await req.formData();
    const message = (formData.get("message") as string)?.trim();
    const username = (formData.get("username") as string)?.trim(); // for anonymous

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

    // Require either a message OR at least one attachment
    const hasMessage = message && message.length > 0;
    const hasAttachments = attachmentFiles.length > 0;

    if (!hasMessage && !hasAttachments) {
      return NextResponse.json(
        { error: "Message or attachment is required" },
        { status: 400 }
      );
    }

    const cashin = await prisma.cashin.findUnique({ where: { id } });
    if (!cashin) {
      return NextResponse.json({ error: "Cashin not found" }, { status: 404 });
    }

    // Create thread/comment
    const thread = await prisma.cashinThread.create({
      data: {
        message: hasMessage ? message : "",
        cashinId: id,
        authorId: currentUser?.id || null, // optional for admins
        authorName: !currentUser?.id && username ? username : null, // store player username
      },
    });

    // Upload attachments if any
    if (hasAttachments) {
      const uploadPromises = attachmentFiles.map(async (file) => {
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

      await prisma.cashinAttachment.createMany({
        data: attachmentData.map((att) => ({
          url: att.url,
          filename: att.filename,
          mimetype: att.mimetype,
          cashinThreadId: thread.id,
        })),
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
              message: `${currentUser?.username} mentioned you in a cashin comment.`,
              link: `/${casinoGroup}/cash-ins/${id}`, // adjust front-end link
              type: "mention",
              actor: currentUser?.username,
              subject: "Cashin Thread",
              casinoGroup: casinoGroup ?? "", // adjust if needed,
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
    // Return thread including attachments and author info
    const createdThread = await prisma.cashinThread.findUnique({
      where: { id: thread.id },
      include: { attachments: true, author: true },
    });

    // 🔥 REALTIME PUSH
    await pusher.trigger(`chatbased-cashin-${id}`, "cashin:thread-updated", {
      cashinId: id,
    });

    return NextResponse.json({ success: true, thread: createdThread });
  } catch (e: any) {
    console.error("Error creating thread:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

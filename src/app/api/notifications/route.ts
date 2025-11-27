import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { pusher } from "@/lib/pusher";

// POST: Send notifications
export async function POST(req: NextRequest) {
  const { userIds, message, link } = await req.json();

  if (!userIds || !Array.isArray(userIds) || !message) {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }

  // Save notifications to DB and trigger Pusher per user
  const notifications = await Promise.all(
    userIds.map(async (userId: string) => {
      // Adjust model name if needed
      const notif = await prisma.notifications.create({
        data: { userId, message, link, isRead: false },
      });
      // Send full notification to Pusher
      await pusher.trigger(
        `private-notifications-${userId}`,
        "new-notification",
        notif
      );
      return notif;
    })
  );

  return NextResponse.json({ notifications }, { status: 200 });
}

// GET: Fetch notifications for a user
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  const notifications = await prisma.notifications.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ notifications }, { status: 200 });
}

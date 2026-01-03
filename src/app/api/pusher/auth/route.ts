import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { pusher } from "@/lib/pusher";

export async function POST(req: NextRequest) {
  const formData = await req.formData();

  const socket_id = formData.get("socket_id") as string;
  const channel_name = formData.get("channel_name") as string;

  // Try authenticated user
  const session = await getServerSession();

  let userId: string;
  let userInfo: any;

  if (session?.user) {
    userId = `user:${session.user.id}`;
    userInfo = {
      type: "auth",
      username: session.user.name,
    };
  } else {
    // Guest fallback
    const guestId = req.cookies.get("guest_id")?.value ?? crypto.randomUUID();

    userId = `guest:${guestId}`;
    userInfo = { type: "guest" };
  }

  const authResponse = pusher.authorizeChannel(socket_id, channel_name, {
    user_id: userId,
    user_info: userInfo,
  });

  return NextResponse.json(authResponse);
}

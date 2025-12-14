import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import Pusher from "pusher";
import { v4 as uuidv4 } from "uuid";
import prisma from "@/lib/prisma";
import { ADMINROLES } from "@/lib/types/role";
import { createReadyCheck } from "../store";
import { getCurrentUser } from "@/lib/auth";

// Ensure these env vars exist on your server
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
});

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (
      !currentUser ||
      (currentUser.role !== ADMINROLES.SUPERADMIN &&
        currentUser.role !== ADMINROLES.TL)
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch participants — here I used "active = true" to mean logged-in.
    const participants = await prisma.user.findMany({
      where: { active: true },
      select: { id: true, name: true, username: true },
    });

    const id = uuidv4();
    const rec = {
      id,
      initiator: {
        id: currentUser.id,
        name: currentUser.name,
        username: currentUser.username ?? undefined,
      },
      participants: participants.map((p) => ({
        id: p.id,
        name: p.name,
        username: p.username,
      })),
      responses: Object.fromEntries(participants.map((p) => [p.id, false])),
      createdAt: new Date().toISOString(),
    };

    // store in-memory
    createReadyCheck(rec);

    // Broadcast start event to all clients subscribed to channel "ready-check"
    await pusher.trigger("ready-check", "ready-check-start", {
      id: rec.id,
      initiator: rec.initiator,
      participants: rec.participants,
      createdAt: rec.createdAt,
    });

    return NextResponse.json({ id: rec.id });
  } catch (err: any) {
    console.error("start ready-check error:", err);
    return NextResponse.json(
      { error: err?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

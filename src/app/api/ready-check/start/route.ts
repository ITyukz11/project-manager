import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { v4 as uuidv4 } from "uuid";
import prisma from "@/lib/prisma"; // adjust to your prisma import
import { ADMINROLES } from "@/lib/types/role";
import { createReadyCheck } from "../store";
import { getCurrentUser } from "@/lib/auth";
import { pusher } from "@/lib/pusher";

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (
      !currentUser ||
      (currentUser.role !== ADMINROLES.SUPERADMIN &&
        currentUser.role !== ADMINROLES.ADMIN)
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch participants - adjust logic to your presence method
    const fetched = await prisma.user.findMany({
      where: { active: true },
      select: { id: true, name: true, username: true, role: true },
    });

    const participants = fetched.map((p) => ({
      id: p.id,
      name: p.name,
      username: p.username,
      role: p.role,
    }));

    // ensure initiator present
    if (!participants.some((p) => p.id === currentUser.id)) {
      participants.unshift({
        id: currentUser.id,
        name: currentUser.name ?? undefined,
        username: currentUser.username ?? undefined,
        role: currentUser.role ?? undefined,
      });
    }

    const id = uuidv4();
    const rec = {
      id,
      initiator: {
        id: currentUser.id,
        name: currentUser.name ?? undefined,
        username: currentUser.username ?? undefined,
        role: currentUser.role ?? undefined,
      },
      participants,
      responses: Object.fromEntries(
        participants.map((p) => [p.id, false] as const)
      ),
      createdAt: new Date().toISOString(),
    };

    createReadyCheck(rec);

    console.log(
      `[ReadyCheck] Starting ${id} with ${participants.length} participants. Initiator: ${currentUser.id}`
    );

    try {
      await pusher.trigger("ready-check", "ready-check-start", {
        id: rec.id,
        initiator: rec.initiator,
        participants: rec.participants,
        createdAt: rec.createdAt,
      });
      console.log(`[ReadyCheck] pusher.trigger succeeded for ${id}`);
    } catch (pusherErr) {
      console.error("[ReadyCheck] pusher.trigger error:", pusherErr);
      // still return id so client has it, but log error
      return NextResponse.json(
        { error: "Pusher trigger failed", details: String(pusherErr) },
        { status: 500 }
      );
    }

    return NextResponse.json({ id: rec.id });
  } catch (err: any) {
    console.error("[ReadyCheck] start error:", err);
    return NextResponse.json(
      { error: err?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

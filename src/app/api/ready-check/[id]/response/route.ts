import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import Pusher from "pusher";
import { getReadyCheck, updateResponse } from "../../store"; // path: app/api/ready-check/store.ts
import { getCurrentUser } from "@/lib/auth";

// Server-side Pusher client (uses server env vars)
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID ?? "",
  key: process.env.PUSHER_KEY ?? "",
  secret: process.env.PUSHER_SECRET ?? "",
  cluster: process.env.PUSHER_CLUSTER ?? "",
  useTLS: true,
});

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id?: string }> | { id?: string } }
) {
  try {
    const params = await context.params;
    const id = params?.id;
    if (!id) {
      return NextResponse.json(
        { error: "Missing ready-check id" },
        { status: 400 }
      );
    }

    // Ensure user is authenticated
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse body
    const json = await req.json().catch(() => ({}));
    const ready = !!json.ready;

    console.log(
      `[ReadyCheck] response PATCH called. id=${id} user=${currentUser.id} ready=${ready}`
    );

    // Lookup the ready-check record in memory (or DB if you replaced store)
    const rec = getReadyCheck(id);
    if (!rec) {
      return NextResponse.json(
        { error: "Ready-check not found" },
        { status: 404 }
      );
    }

    // Ensure the current user is a participant
    const isParticipant = rec.participants.some((p) => p.id === currentUser.id);
    if (!isParticipant) {
      return NextResponse.json(
        { error: "You are not a participant of this ready check" },
        { status: 403 }
      );
    }

    // Update the in-memory record
    const updated = updateResponse(id, currentUser.id, ready);
    if (!updated) {
      return NextResponse.json(
        { error: "Failed to update response" },
        { status: 500 }
      );
    }

    const total = updated.participants.length;
    const readyCount = Object.values(updated.responses).filter(Boolean).length;

    // Broadcast update to all clients subscribed to the public "ready-check" channel
    try {
      await pusher.trigger("ready-check", "ready-check-update", {
        id: updated.id,
        userId: currentUser.id,
        ready,
        readyCount,
        total,
        responses: updated.responses,
      });
    } catch (pusherErr: any) {
      console.error("[ReadyCheck] pusher.trigger error:", pusherErr);
      return NextResponse.json(
        { error: "Failed to broadcast update", details: String(pusherErr) },
        { status: 500 }
      );
    }

    console.log(
      `[ReadyCheck] recorded response for user=${currentUser.id} ready=${ready} (${readyCount}/${total})`
    );
    return NextResponse.json({ ok: true, readyCount, total });
  } catch (err: any) {
    console.error("[ReadyCheck] PATCH /response error:", err);
    return NextResponse.json(
      { error: err?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

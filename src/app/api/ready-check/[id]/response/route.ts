import { getCurrentUser } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import Pusher from "pusher";
import { getReadyCheck, updateResponse } from "../../store";
import { pusher } from "@/lib/pusher";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id?: string }> | { id?: string } }
) {
  try {
    const params = await context.params;
    const id = params?.id;
    console.log(`[ReadyCheck] PATCH called for id=${id}`);

    if (!id) {
      return NextResponse.json(
        { error: "Missing ready-check id" },
        { status: 400 }
      );
    }

    const currentUser = await getCurrentUser();
    console.log(`[ReadyCheck] Current user: ${currentUser?.id}`);

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await req.json().catch(() => ({}));
    const ready = !!json.ready;

    const rec = getReadyCheck(id);
    if (!rec) {
      console.warn(`[ReadyCheck] record not found for id=${id}`);
      return NextResponse.json(
        { error: "Ready-check not found" },
        { status: 404 }
      );
    }

    const isParticipant = rec.participants.some((p) => p.id === currentUser.id);
    if (!isParticipant) {
      return NextResponse.json(
        { error: "You are not a participant of this ready check" },
        { status: 403 }
      );
    }

    const updated = updateResponse(id, currentUser.id, ready);
    if (!updated) {
      return NextResponse.json(
        { error: "Failed to update response" },
        { status: 500 }
      );
    }

    const total = updated.participants.length;
    const readyCount = Object.values(updated.responses).filter(Boolean).length;

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

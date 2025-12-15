import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { pusher } from "@/lib/pusher";

/**
 * POST /api/ready-check/end
 *
 * Body (JSON):
 * {
 *   id?: string, // optional client-provided id (will be used as PK if provided)
 *   initiatorId?: string, // optional (will be validated against authenticated user)
 *   participants: string[] | { id: string }[], // array of user ids (or objects with id)
 *   responses: Record<userId, boolean>, // who clicked ready
 *   context?: string,
 *   startedAt?: string (ISO)
 * }
 *
 * Behavior:
 * - Authenticated user must be the initiator (or an admin if you want to relax this).
 * - Fetches participants from DB to take authoritative snapshots (username, role, isClockedIn).
 * - Creates a ReadyCheck record and ReadyCheckParticipant rows in a transaction.
 * - Computes totalParticipants and totalClockedIn from DB snapshots.
 * - Broadcasts a pusher event "ready-check-ended" with a small summary.
 */
export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json().catch(() => ({}))) as {
      id?: string;
      initiatorId?: string;
      participants?: Array<string | { id: string }>;
      responses?: Record<string, boolean>;
      context?: string;
      startedAt?: string;
    };

    const initiatorId = body.initiatorId ?? currentUser.id;
    if (initiatorId !== currentUser.id) {
      // If you prefer to allow admins to finalize other users' ready checks, adjust this check.
      return NextResponse.json(
        { error: "Only the initiator may end this ready-check" },
        { status: 403 }
      );
    }

    const participantIds = (body.participants ?? [])
      .map((p) => (typeof p === "string" ? p : p?.id))
      .filter(Boolean) as string[];

    if (!participantIds.length) {
      return NextResponse.json(
        { error: "No participants provided" },
        { status: 400 }
      );
    }

    const responses = body.responses ?? {};

    // Fetch participant users from DB to take snapshots (username, role, isClockedIn)
    const users = await prisma.user.findMany({
      where: { id: { in: participantIds } },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        isClockedIn: true,
      },
    });

    if (!users.length) {
      return NextResponse.json(
        { error: "No valid participants found" },
        { status: 400 }
      );
    }

    // Build participant create data and compute totals
    const participantsCreate = users.map((u) => {
      const responded = Boolean(responses?.[u.id]);
      return {
        userId: u.id,
        wasClockedIn: Boolean(u.isClockedIn),
        responded,
        respondedAt: responded ? new Date() : undefined,
        username: u.username ?? u.name ?? undefined,
        role: u.role ?? undefined,
      };
    });

    const totalParticipants = participantsCreate.length;
    const totalClockedIn = participantsCreate.reduce(
      (acc, p) => acc + (p.wasClockedIn ? 1 : 0),
      0
    );
    const readyCount = participantsCreate.reduce(
      (acc, p) => acc + (p.responded ? 1 : 0),
      0
    );

    // Parse startedAt if provided
    const startedAt = body.startedAt ? new Date(body.startedAt) : undefined;

    // Create ReadyCheck + participants in a transaction
    const now = new Date();
    const createData: any = {
      initiatorId,
      context: body.context ?? undefined,
      startedAt: startedAt ?? undefined,
      endedAt: now,
      totalParticipants,
      totalClockedIn,
      participants: {
        create: participantsCreate,
      },
    };

    // If client provided id, use it (will error if already exists)
    if (body.id) {
      createData.id = body.id;
    }

    const readyCheck = await prisma.readyCheck.create({
      data: createData,
      include: {
        participants: {
          select: {
            id: true,
            userId: true,
            wasClockedIn: true,
            responded: true,
            respondedAt: true,
            username: true,
            role: true,
            createdAt: true,
          },
        },
      },
    });

    // Broadcast summary to pusher so listeners can update UI/history
    try {
      await pusher.trigger("ready-check", "ready-check-ended", {
        id: readyCheck.id,
        initiatorId,
        totalParticipants,
        totalClockedIn,
        readyCount,
        endedAt: readyCheck.endedAt,
        context: readyCheck.context ?? null,
      });
    } catch (err) {
      console.warn("pusher.trigger ready-check-ended failed:", err);
      // Non-fatal — we still return success
    }

    return NextResponse.json({ readyCheck }, { status: 201 });
  } catch (err: any) {
    console.error("ready-check end error:", err);
    // Handle unique constraint if client-provided id already exists
    if (err?.code === "P2002") {
      return NextResponse.json(
        { error: "ReadyCheck with that id already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: err?.message ?? "Internal Server Error" },
      { status: 500 }
    );
  }
}

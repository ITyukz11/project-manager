import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { ADMINROLES } from "@/lib/types/role";

/**
 * GET /api/ready-check/:id
 *
 * Returns a ReadyCheck with participants and initiator metadata.
 * Authorization:
 * - SUPERADMIN / ADMIN may fetch any ready-check
 * - The initiator may fetch its own ready-check
 * - Any participant (user included in participants) may fetch the ready-check
 *
 * Response shape:
 * {
 *   id,
 *   initiator: { id, name, username, role },
 *   context,
 *   startedAt,
 *   endedAt,
 *   totalParticipants,
 *   totalClockedIn,
 *   participants: [
 *     { id, userId, wasClockedIn, responded, respondedAt, username, role, createdAt }
 *   ],
 *   createdAt, updatedAt
 * }
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params?.id;
    if (!id) {
      return NextResponse.json(
        { error: "Missing ready-check id" },
        { status: 400 }
      );
    }

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const readyCheck = await prisma.readyCheck.findUnique({
      where: { id },
      include: {
        initiator: {
          select: { id: true, name: true, username: true, role: true },
        },
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
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!readyCheck) {
      return NextResponse.json(
        { error: "Ready-check not found" },
        { status: 404 }
      );
    }

    const isAdmin =
      currentUser.role === ADMINROLES.SUPERADMIN ||
      currentUser.role === ADMINROLES.ADMIN;

    const isInitiator = currentUser.id === readyCheck.initiatorId;
    const isParticipant = readyCheck.participants.some(
      (p) => p.userId === currentUser.id
    );

    if (!isAdmin && !isInitiator && !isParticipant) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(readyCheck, { status: 200 });
  } catch (err: any) {
    console.error("ready-check fetch error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Internal Server Error" },
      { status: 500 }
    );
  }
}

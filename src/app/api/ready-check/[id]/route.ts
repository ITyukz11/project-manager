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
 * Note: Next.js may provide `params` as a Promise in this environment,
 * so we await it before accessing properties.
 */
export async function GET(
  _request: NextRequest,
  context: { params?: { id?: string } | Promise<{ id?: string }> }
) {
  try {
    // params may be a Promise in some Next.js runtimes — await it.
    const params = context.params ? await context.params : {};
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
    // @ts-expect-error - TS doesn't know participants has userId field
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

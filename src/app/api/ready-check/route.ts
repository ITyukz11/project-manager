import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { ADMINROLES } from "@/lib/types/role";

/**
 * GET /api/ready-check
 *
 * Query params:
 * - page?: number (1-based, default 1)
 * - limit?: number (default 50, max 1000)
 * - includeParticipants?: "true" | "false" (default true)
 *
 * Behavior:
 * - SUPERADMIN / ADMIN can fetch all ready-checks.
 * - Non-admins will receive only ready-checks where they are the initiator
 *   or where they are a participant.
 *
 * Response:
 * {
 *   data: ReadyCheck[],
 *   meta: { total: number, page: number, limit: number }
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const pageParam = url.searchParams.get("page");
    const limitParam = url.searchParams.get("limit");
    const includeParticipantsParam = url.searchParams.get(
      "includeParticipants"
    );

    const page = Math.max(
      1,
      Number.isNaN(Number(pageParam))
        ? 1
        : Math.max(1, parseInt(pageParam || "1", 10))
    );
    let limit = limitParam
      ? Math.max(1, Math.min(1000, parseInt(limitParam, 10)))
      : 50;
    if (!limit) limit = 50;

    const includeParticipants = includeParticipantsParam !== "false";

    const isAdmin =
      currentUser.role === ADMINROLES.SUPERADMIN ||
      currentUser.role === ADMINROLES.ADMIN;

    const whereClause: any = {};

    if (!isAdmin) {
      // Non-admins only see ready-checks they started or participated in
      whereClause.OR = [
        { initiatorId: currentUser.id },
        { participants: { some: { userId: currentUser.id } } },
      ];
    }

    const skip = (page - 1) * limit;
    const take = limit;

    // total count for pagination
    const total = await prisma.readyCheck.count({ where: whereClause });

    const readyChecks = await prisma.readyCheck.findMany({
      where: whereClause,
      orderBy: { startedAt: "desc" },
      skip,
      take,
      include: {
        initiator: {
          select: { id: true, name: true, username: true, role: true },
        },
        participants: includeParticipants
          ? {
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
            }
          : false,
      },
    });

    return NextResponse.json(
      {
        data: readyChecks,
        meta: {
          total,
          page,
          limit,
        },
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("ready-check list error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Internal Server Error" },
      { status: 500 }
    );
  }
}

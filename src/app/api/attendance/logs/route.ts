import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { ADMINROLES } from "@/lib/types/role";

/**
 * GET /api/attendance/logs?userId=<id>&limit=<n>
 *
 * - If `userId` is provided:
 *    - allow if requester is the same user OR requester is ADMIN/SUPERADMIN
 *    - returns that user's attendance logs (most recent first)
 *
 * - If `userId` is not provided:
 *    - only ADMIN/SUPERADMIN can call this and will receive logs for all users
 *
 * Query params:
 * - userId: optional
 * - limit: optional integer, default 100, max 1000
 *
 * Response: JSON array of Attendance records, each including a small `user` object:
 * [
 *   {
 *     id, userId, time, particular, active, context, ipAddress, device, createdAt, updatedAt,
 *     user: { id, name, username, role }
 *   },
 *   ...
 * ]
 */
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const userId = url.searchParams.get("userId") ?? undefined;
    const limitParam = url.searchParams.get("limit");
    let limit = 100;
    if (limitParam) {
      const parsed = Number(limitParam);
      if (!Number.isNaN(parsed)) {
        limit = Math.max(1, Math.min(1000, Math.floor(parsed)));
      }
    }

    const isAdmin =
      currentUser.role === ADMINROLES.SUPERADMIN ||
      currentUser.role === ADMINROLES.ADMIN;

    // Authorization checks
    if (userId) {
      // allow if requester is same user or is admin
      if (currentUser.id !== userId && !isAdmin) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else {
      // requesting all logs — only admins allowed
      if (!isAdmin) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const whereClause: any = {};
    if (userId) whereClause.userId = userId;

    const logs = await prisma.attendance.findMany({
      where: whereClause,
      orderBy: { time: "desc" },
      take: limit,
      include: {
        user: {
          select: { id: true, name: true, username: true, role: true },
        },
      },
    });

    return NextResponse.json(logs, { status: 200 });
  } catch (err: any) {
    console.error("attendance logs error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

/**
 * GET /api/attendance/status
 *
 * Returns authoritative clock-in status for the current authenticated user.
 * Response shape:
 * {
 *   isClockedIn: boolean,
 * }
 */
export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch denormalized flag and any active attendance record
    const [user] = await prisma.$transaction([
      prisma.user.findUnique({
        where: { id: currentUser.id },
        select: { isClockedIn: true },
      }),
      // also fetch most recent active attendance (if any)
      prisma.attendance.findFirst({
        where: { userId: currentUser.id, active: true },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    // Note: `user` here is the result of the first query in the transaction.
    // We can fetch attendance separately if you prefer not to use a transaction.
    const activeAttendance = (await prisma.attendance.findFirst({
      where: { userId: currentUser.id, active: true },
      orderBy: { createdAt: "desc" },
    })) as {
      id: string;
      startedAt: Date;
      context?: string | null;
      ipAddress?: string | null;
      device?: string | null;
    } | null;

    return NextResponse.json(
      {
        isClockedIn: Boolean(user?.isClockedIn),
        activeAttendance: activeAttendance
          ? {
              id: activeAttendance.id,
              startedAt: activeAttendance.startedAt,
              context: activeAttendance.context ?? null,
              ipAddress: activeAttendance.ipAddress ?? null,
              device: activeAttendance.device ?? null,
            }
          : null,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("attendance status error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

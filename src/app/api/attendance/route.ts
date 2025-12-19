import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { pusher, emitOnlineUsersUpdate } from "@/lib/pusher";

/**
 * POST /api/attendance
 * body: { action: "clock-in" | "clock-out", context?: string }
 *
 * Behavior:
 * - clock-in:
 *    - if user already has an active attendance -> returns 400 (already clocked in)
 *    - otherwise: create Attendance (particular = "clock-in", active = true, ipAddress, device, context)
 *      and set user.isClockedIn = true (transaction)
 * - clock-out:
 *    - find most recent active attendance (userId, active = true)
 *    - if found:  update that attendance.active = false (to mark session ended)
 *      then create a separate Attendance record (particular = "clock-out", active = false, ...).
 *    - if not found: still create a clock-out Attendance record (no active to update)
 *    - set user.isClockedIn = false (transaction)
 *
 * Both actions return the created attendance record (and updated user state via select).
 */

function extractClientInfo(req: NextRequest) {
  // Prefer X-Forwarded-For for proxied requests
  const xff = req.headers.get("x-forwarded-for");
  const ip = xff
    ? xff.split(",")[0].trim()
    : req.headers.get("x-real-ip") ?? "unknown";
  const ua = req.headers.get("user-agent") ?? "unknown";
  // limit lengths to match schema (ip up to 45, device up to 255)
  const ipAddress = ip.length > 45 ? ip.slice(0, 45) : ip;
  const device = ua.length > 255 ? ua.slice(0, 255) : ua;
  return { ipAddress, device };
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // parse body safely
    const body = (await request.json().catch(() => ({}))) as
      | { action?: string; context?: string }
      | undefined;
    const rawAction = (body?.action ?? "").toString().toLowerCase();
    const context = body?.context ?? null;

    if (
      !rawAction ||
      !["clock-in", "clockout", "clock-out", "in", "out"].includes(rawAction)
    ) {
      return NextResponse.json(
        { error: "Invalid action. Use 'clock-in' or 'clock-out'." },
        { status: 400 }
      );
    }

    const action =
      rawAction === "in"
        ? "clock-in"
        : rawAction === "out"
        ? "clock-out"
        : rawAction;

    const { ipAddress, device } = extractClientInfo(request);

    if (action === "clock-in") {
      // Prevent double clock-in: check if there's an active attendance
      const existingActive = await prisma.attendance.findFirst({
        where: { userId: currentUser.id, active: true },
        orderBy: { createdAt: "desc" },
      });

      if (existingActive) {
        return NextResponse.json(
          { error: "User already clocked in." },
          { status: 400 }
        );
      }

      // create attendance and set user.isClockedIn = true atomically
      const created = await prisma.$transaction(async (tx) => {
        const attendance = await tx.attendance.create({
          data: {
            userId: currentUser.id,
            particular: "clock-in",
            active: true,
            context,
            ipAddress,
            device,
          },
        });

        const user = await tx.user.update({
          where: { id: currentUser.id },
          data: { isClockedIn: true },
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
            role: true,
            isClockedIn: true,
          },
        });

        return { attendance, user };
      });

      // Broadcast via pusher so admin clients can update UI
      if (pusher) {
        try {
          // Original attendance event
          await pusher.trigger("attendance", "user-clocked-in", {
            userId: currentUser.id,
            clockedIn: true,
            attendanceId: created.attendance.id,
            ipAddress,
            device,
            context,
          });

          // NEW: Trigger online users update
          await emitOnlineUsersUpdate();
        } catch (err) {
          console.warn("Pusher trigger failed (user-clocked-in):", err);
        }
      }

      return NextResponse.json(
        { ok: true, attendance: created.attendance, user: created.user },
        { status: 201 }
      );
    }

    // clock-out flow
    if (action === "clock-out") {
      // find active attendance for this user
      const active = await prisma.attendance.findFirst({
        where: { userId: currentUser.id, active: true },
        orderBy: { createdAt: "desc" },
      });

      const result = await prisma.$transaction(async (tx) => {
        // if there is an active attendance, mark it inactive
        let updatedActive: any = null;
        if (active) {
          updatedActive = await tx.attendance.update({
            where: { id: active.id },
            data: { active: false },
          });
        }

        // create a clock-out attendance record (log the event)
        const attendanceOut = await tx.attendance.create({
          data: {
            userId: currentUser.id,
            particular: "clock-out",
            active: false,
            context,
            ipAddress,
            device,
          },
        });

        // update user.isClockedIn = false
        const user = await tx.user.update({
          where: { id: currentUser.id },
          data: { isClockedIn: false },
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
            role: true,
            isClockedIn: true,
          },
        });

        return { updatedActive, attendanceOut, user };
      });

      if (pusher) {
        try {
          // Original attendance event
          await pusher.trigger("attendance", "user-clocked-out", {
            userId: currentUser.id,
            clockedIn: false,
            attendanceId: result.attendanceOut.id,
            ipAddress,
            device,
            context,
          });

          // NEW: Trigger online users update
          await emitOnlineUsersUpdate();
        } catch (err) {
          console.warn("Pusher trigger failed (user-clocked-out):", err);
        }
      }

      return NextResponse.json(
        { ok: true, attendance: result.attendanceOut, user: result.user },
        { status: 200 }
      );
    }

    return NextResponse.json({ error: "Unhandled action" }, { status: 400 });
  } catch (err: any) {
    console.error("Attendance route error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Internal Server Error" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { ADMINROLES } from "@/lib/types/role";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin =
      currentUser.role === ADMINROLES.SUPERADMIN ||
      currentUser.role === ADMINROLES.ADMIN;

    // Only admins can see who's online
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get all users who are currently clocked in
    const onlineUsers = await prisma.user.findMany({
      where: {
        isClockedIn: true,
        active: true, // only active users
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        isClockedIn: true,
        // Get the latest clock-in attendance record
        attendances: {
          where: {
            active: true,
          },
          orderBy: {
            time: "desc",
          },
          take: 1,
          select: {
            id: true,
            time: true,
            ipAddress: true,
            device: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    // Transform the data to flatten the attendance info
    const formattedUsers = onlineUsers.map((user) => ({
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      time: user.attendances[0]?.time || null,
      ipAddress: user.attendances[0]?.ipAddress || null,
      device: user.attendances[0]?.device || null,
      isClockedIn: user.isClockedIn,
      lastClockIn: user.attendances[0] || null,
    }));

    return NextResponse.json(
      {
        count: formattedUsers.length,
        users: formattedUsers,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("online users error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

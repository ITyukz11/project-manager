import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // Fetch group chats and filter out users with username "blurredface"
    const groupchats = await prisma.groupChat.findMany({
      include: {
        _count: {
          select: { users: true },
        },
        users: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(groupchats, { status: 200 });
  } catch (error) {
    console.error("Error fetching groupchats:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, status, users } = body;

    if (!name || typeof status !== "boolean" || !Array.isArray(users)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // Create the group chat and connect the users
    const newGroupChat = await prisma.groupChat.create({
      data: {
        name,
        status,
        users: {
          connect: users.map((id: string) => ({ id })),
        },
      },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });

    return NextResponse.json(newGroupChat, { status: 201 });
  } catch (error) {
    console.error("Error creating group chat:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

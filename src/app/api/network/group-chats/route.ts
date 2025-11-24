import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get casinoGroup from URL search params
    const url = new URL(request.url);
    const casinoGroup = url.searchParams.get("casinoGroup");

    // Build base where clause for admin roles
    const whereClause: any = {};

    // If casinoGroup is provided, add filter
    if (casinoGroup) {
      whereClause.casinoGroup = {
        name: { equals: casinoGroup, mode: "insensitive" },
      };
    }

    const groupchats = await prisma.groupChat.findMany({
      where: whereClause,
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
    const { name, status, users, casinoGroupName } = body;

    if (!name || typeof status !== "boolean" || !Array.isArray(users)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const casinoGroup = await prisma.casinoGroup.findFirst({
      where: {
        name: {
          equals: casinoGroupName,
          mode: "insensitive",
        },
      },
      select: { id: true },
    });

    if (!casinoGroup) {
      return NextResponse.json(
        { error: "Casino Group not found" },
        { status: 404 }
      );
    }

    // Create the group chat and connect the users
    const newGroupChat = await prisma.groupChat.create({
      data: {
        name,
        status,
        casinoGroupId: casinoGroup?.id,
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

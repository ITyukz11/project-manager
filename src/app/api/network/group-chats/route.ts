import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const groupchats = await prisma.groupChat.findMany({
      where: {
        status: true, // only active groupchats
      },
      include: {
        _count: {
          select: { users: true },
        },
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

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, status = true, users } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }

    const newGroupChat = await prisma.groupChat.create({
      data: {
        name,
        status,
        users:
          users && users.length > 0
            ? { connect: users.map((id: string) => ({ id })) }
            : undefined,
      },
      include: {
        users: true,
      },
    });

    return NextResponse.json(newGroupChat, { status: 201 });
  } catch (error) {
    console.error("Error creating groupchat:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

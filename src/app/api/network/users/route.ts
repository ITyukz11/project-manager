import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth"; // <-- you must implement this
import { ROLES } from "@/lib/types/role";
import { $Enums } from "@prisma/client";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let users: ({ _count: { groupChats: number } } & {
      type: $Enums.Role;
      name: string;
      email: string;
      username: string | null;
      messengerLink: string | null;
      userId: string;
      id: string;
      active: boolean;
      createdAt: Date;
      updatedAt: Date;
    })[];

    if (currentUser.role === ROLES.ADMIN) {
      // Admin sees all
      users = await prisma.networkUser.findMany({
        include: {
          _count: {
            select: { groupChats: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    } else {
      // Non-admin sees only network users they are the parent of
      users = await prisma.networkUser.findMany({
        where: { userId: currentUser.id },

        include: {
          _count: {
            select: { groupChats: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    }

    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    console.error("Error fetching users network:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== ROLES.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const { name, email, username, messengerLink, type, groupChats } = body;

    if (!name || !email || !type) {
      return NextResponse.json(
        { error: "Required fields missing" },
        { status: 400 }
      );
    }

    const newUser = await prisma.networkUser.create({
      data: {
        name,
        email,
        username: username || null,
        messengerLink: messengerLink || null,
        type,
        userId: currentUser.id,
        groupChats:
          groupChats && groupChats.length
            ? { connect: groupChats.map((id: string) => ({ id })) }
            : undefined,
      },
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error("Error creating network user:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

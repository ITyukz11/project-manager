import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { ADMINROLES, NETWORKROLES } from "@/lib/types/role";

// Get network roles as array
const networkRolesArray = Object.values(NETWORKROLES);

// Blurred Face usernames to exclude
const blurredFaceUsernames = ["blurredface"]; // update as needed

export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch only network-role users, exclude blurred user(s)
    const users = await prisma.user.findMany({
      where: {
        role: { in: networkRolesArray },
        NOT: { username: { in: blurredFaceUsernames } },
      },
      include: {
        _count: {
          select: { groupChats: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    console.error("Error fetching users network:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// POST stays the same – you do not need to change this logic for the blurring requirement.
export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();

    if (
      !currentUser ||
      (currentUser.role !== ADMINROLES.ADMIN &&
        currentUser.role !== ADMINROLES.SUPERADMIN)
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const { name, email, username, password, messengerLink, role, groupChats } =
      body;

    if (!name || !email || !role) {
      return NextResponse.json(
        { error: "Required fields missing" },
        { status: 400 }
      );
    }

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        username: username || null,
        password,
        messengerLink: messengerLink || null,
        role,
        active: true,
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

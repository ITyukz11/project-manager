import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { ADMINROLES, NETWORKROLES } from "@/lib/types/role";

// Get network roles as array
const networkRolesArray = Object.values(NETWORKROLES);

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get casinoGroup from URL search params
    const url = new URL(req.url);
    const casinoGroup = url.searchParams.get("casinoGroup");

    // Build base where clause for admin roles
    const whereClause: any = {
      role: { in: networkRolesArray },
    };

    // If casinoGroup is provided, add filter
    if (casinoGroup) {
      whereClause.casinoGroups = {
        some: {
          name: { equals: casinoGroup, mode: "insensitive" },
        },
      };
    }

    // Fetch only network-role users
    const users = await prisma.user.findMany({
      where: whereClause,
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

// POST: create user and connect to casinoGroups, groupChats
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

    // Accept casinoGroups as array of IDs (not names)
    const {
      name,
      email,
      username,
      password,
      messengerLink,
      role,
      casinoGroups,
      groupChats,
    } = body;

    if (!name || !email || !role) {
      return NextResponse.json(
        { error: "Required fields missing" },
        { status: 400 }
      );
    }

    if (!casinoGroups || !Array.isArray(casinoGroups) || !casinoGroups.length) {
      return NextResponse.json(
        { error: "At least one casino group id is required." },
        { status: 400 }
      );
    }

    // Validate casinoGroups array and check if those group ids exist
    let casinoGroupsToConnect: { id: string }[] = [];
    if (Array.isArray(casinoGroups) && casinoGroups.length) {
      // Filter IDs that really exist
      const foundCasinoGroups = await prisma.casinoGroup.findMany({
        where: { id: { in: casinoGroups } },
        select: { id: true },
      });

      casinoGroupsToConnect = foundCasinoGroups.map((g) => ({ id: g.id }));

      if (casinoGroups.length !== foundCasinoGroups.length) {
        return NextResponse.json(
          { error: "One or more casino group IDs do not exist." },
          { status: 400 }
        );
      }
    }

    // Validate groupChats array of IDs
    let groupChatsToConnect: { id: string }[] | undefined = undefined;
    if (Array.isArray(groupChats) && groupChats.length) {
      const foundGroupChats = await prisma.groupChat.findMany({
        where: { id: { in: groupChats } },
        select: { id: true },
      });
      if (foundGroupChats.length !== groupChats.length) {
        return NextResponse.json(
          { error: "One or more group chat IDs do not exist." },
          { status: 400 }
        );
      }
      groupChatsToConnect = foundGroupChats.map((gc) => ({ id: gc.id }));
    }

    // Create new user and connect relationships
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        username: username || null,
        password,
        messengerLink: messengerLink || null,
        role,
        active: true,
        casinoGroups: casinoGroupsToConnect.length
          ? { connect: casinoGroupsToConnect }
          : undefined,
        groupChats: groupChatsToConnect
          ? { connect: groupChatsToConnect }
          : undefined,
      },
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error: any) {
    console.error("Error creating network user:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

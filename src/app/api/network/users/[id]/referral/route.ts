import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma"; // Adjust import if you keep prisma elsewhere
import { getCurrentUser } from "@/lib/auth";
import { NETWORKROLES } from "@/lib/types/role";

// Get network roles as array
const networkRolesArray = Object.values(NETWORKROLES);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const username = (await params).id;
    if (!username) {
      return NextResponse.json(
        { error: "Missing username in route params" },
        { status: 400 }
      );
    }
    // Get casinoGroup from URL search params
    const url = new URL(request.url);
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

    if (username) {
      whereClause.referredBy = {
        username: { equals: username, mode: "insensitive" },
      };
    }

    // Fetch only network-role users
    const users = await prisma.user.findMany({
      where: whereClause,
      include: {
        _count: {
          select: { groupChats: true, referrals: true },
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

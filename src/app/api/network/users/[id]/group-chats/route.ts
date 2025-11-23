import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma"; // Adjust import if you keep prisma elsewhere

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const username = (await params).id;
  if (!username) {
    return NextResponse.json(
      { error: "Missing username in route params" },
      { status: 400 }
    );
  }

  // Find all group chats where the specified user belongs
  const groupChats = await prisma.groupChat.findMany({
    where: {
      users: {
        some: {
          username: username,
        },
      },
    },
    include: {
      users: true,
      _count: {
        select: { users: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(groupChats, { status: 200 });
}

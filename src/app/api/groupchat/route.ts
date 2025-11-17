import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const groupChats = await prisma.groupChat.findMany();
    return NextResponse.json(groupChats, { status: 200 });
  } catch (error) {
    console.error("Error fetching group chats:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET handler (for completeness)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = (await params).id;
  if (!id) {
    return NextResponse.json(
      { error: "No group chat id provided." },
      { status: 400 }
    );
  }
  const groupChat = await prisma.groupChat.findUnique({
    where: { id },
    include: { users: true },
  });
  if (!groupChat) {
    return NextResponse.json({ error: "GroupChat not found" }, { status: 404 });
  }
  return NextResponse.json(groupChat, { status: 200 });
}
// PATCH handler
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = (await params).id;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  // Validate users array
  if (
    !Array.isArray(body.users) ||
    body.users.some((u) => typeof u !== "string")
  ) {
    return NextResponse.json(
      { error: "Missing or invalid 'users' field" },
      { status: 400 }
    );
  }

  // Validate name and status
  if (typeof body.name !== "string" || !body.name.trim()) {
    return NextResponse.json(
      { error: "Missing or invalid 'name' field" },
      { status: 400 }
    );
  }

  if (typeof body.status !== "boolean") {
    return NextResponse.json(
      { error: "Missing or invalid 'status' field" },
      { status: 400 }
    );
  }

  try {
    const updatedGroupChat = await prisma.groupChat.update({
      where: { id },
      data: {
        name: body.name,
        status: body.status,
        users: { set: body.users.map((id: string) => ({ id })) },
        updatedAt: new Date(),
      },
      include: { users: true },
    });
    return NextResponse.json(updatedGroupChat, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to update GroupChat",
        details: String(error),
      },
      { status: 500 }
    );
  }
}

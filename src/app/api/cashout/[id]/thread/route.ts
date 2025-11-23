import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = (await params).id;

  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!id) {
      return NextResponse.json(
        { error: "Missing cashout ID" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { message } = body;
    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Find the cashout to ensure it exists
    const cashout = await prisma.cashout.findUnique({ where: { id } });
    if (!cashout) {
      return NextResponse.json({ error: "Cashout not found" }, { status: 404 });
    }

    // Create thread/comment
    const thread = await prisma.cashoutThread.create({
      data: {
        message: message.trim(),
        cashoutId: id,
        authorId: currentUser.id,
      },
    });

    return NextResponse.json({ success: true, thread });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

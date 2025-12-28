import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/user-balance/:id
// For example: /api/user-balance/c467f3cc-6fb1-4ce3-a9d1-a20e629fc88e
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = (await params).id;

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        balance: true, // Make sure you have a `balance` field in your User model!
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      userId: user.id,
      balance: user.balance ?? 0,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "An error occurred" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { amount } = await req.json();

    if (typeof amount !== "number" || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    // Fetch user first
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, balance: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check sufficient balance
    if ((user.balance ?? 0) < amount) {
      return NextResponse.json(
        { error: "Insufficient balance" },
        { status: 400 }
      );
    }

    // Deduct balance
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { balance: { decrement: amount } },
      select: { id: true, balance: true },
    });

    return NextResponse.json({
      success: true,
      userId: updatedUser.id,
      newBalance: updatedUser.balance,
      deducted: amount,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "An error occurred" },
      { status: 500 }
    );
  }
}

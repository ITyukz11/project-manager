import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { pusher } from "@/lib/pusher";

// PATCH handler to update transaction status
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    // Validation
    if (!status || !["PENDING", "COMPLETED", "REJECTED"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be PENDING, COMPLETED, or REJECTED." },
        { status: 400 }
      );
    }

    // Check if transaction exists
    const existingTransaction = await prisma.transactionRequest.findUnique({
      where: { id },
    });

    if (!existingTransaction) {
      return NextResponse.json(
        { error: "Transaction not found." },
        { status: 404 }
      );
    }

    // Update transaction with admin who processed it
    const updatedTransaction = await prisma.transactionRequest.update({
      where: { id },
      data: {
        status,
        processedById: currentUser.id,
        processedAt: new Date(),
      },
      include: {
        processedBy: {
          select: {
            id: true,
            name: true,
            username: true,
            role: true,
          },
        },
        casinoGroup: true,
      },
    });

    // Trigger Pusher notification
    if (process.env.NEXT_PUBLIC_PUSHER_KEY && process.env.PUSHER_SECRET) {
      try {
        await pusher.trigger("transaction-request", "status-updated", {
          id: updatedTransaction.id,
          status: updatedTransaction.status,
          processedBy: currentUser.username,
        });
      } catch (pusherErr) {
        console.error("Pusher error:", pusherErr);
      }
    }

    return NextResponse.json(updatedTransaction);
  } catch (e: any) {
    console.error("Transaction update error:", e);
    return NextResponse.json(
      { error: e.message || "Failed to update transaction." },
      { status: 500 }
    );
  }
}

// GET single transaction
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const transaction = await prisma.transactionRequest.findUnique({
      where: { id },
      include: {
        processedBy: {
          select: {
            id: true,
            name: true,
            username: true,
            role: true,
          },
        },
        casinoGroup: true,
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(transaction);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

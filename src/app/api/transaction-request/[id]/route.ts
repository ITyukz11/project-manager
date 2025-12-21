import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { put } from "@vercel/blob";
import { emitTransactionUpdated } from "@/actions/server/emitTransactionUpdated";

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

    // Parse FormData instead of JSON
    const formData = await req.formData();
    const status = formData.get("status") as string;
    const remarks = formData.get("remarks") as string | null;
    const receiptFile = formData.get("receipt") as File | null;

    // Validation
    if (
      !status ||
      !["PENDING", "APPROVED", "REJECTED", "CLAIMED"].includes(status)
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid status. Must be PENDING, APPROVED, REJECTED, or CLAIMED.",
        },
        { status: 400 }
      );
    }

    // Check if transaction exists
    const existingTransaction = await prisma.transactionRequest.findUnique({
      where: { id },
      include: {
        casinoGroup: {
          select: { name: true },
        },
      },
    });

    if (!existingTransaction) {
      return NextResponse.json(
        { error: "Transaction not found." },
        { status: 404 }
      );
    }

    // Check if cashout approval requires receipt
    if (
      status === "APPROVED" &&
      existingTransaction.type === "CASHOUT" &&
      !existingTransaction.receiptUrl &&
      !receiptFile
    ) {
      return NextResponse.json(
        { error: "Receipt is required for cashout approval." },
        { status: 400 }
      );
    }

    // Handle receipt upload if provided
    let receiptUrl = existingTransaction.receiptUrl;
    if (receiptFile) {
      try {
        // Validate file type
        if (!receiptFile.type.startsWith("image/")) {
          return NextResponse.json(
            { error: "Receipt must be an image file." },
            { status: 400 }
          );
        }

        // Validate file size (5MB)
        if (receiptFile.size > 5 * 1024 * 1024) {
          return NextResponse.json(
            { error: "Receipt file size must be less than 5MB." },
            { status: 400 }
          );
        }

        // Upload to Vercel Blob
        const blob = await put(
          `receipts/${id}-${Date.now()}-${receiptFile.name}`,
          receiptFile,
          {
            access: "public",
            addRandomSuffix: true,
          }
        );

        receiptUrl = blob.url;
      } catch (uploadError: any) {
        console.error("Receipt upload error:", uploadError);
        return NextResponse.json(
          { error: "Failed to upload receipt." },
          { status: 500 }
        );
      }
    }

    // Update transaction with admin who processed it
    const updatedTransaction = await prisma.transactionRequest.update({
      where: { id },
      data: {
        status,
        processedById: currentUser.id,
        processedAt: new Date(),
        remarks: remarks || undefined,
        receiptUrl: receiptUrl || undefined,
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
        await emitTransactionUpdated({
          transactionId: existingTransaction.id,
          casinoGroup: existingTransaction.casinoGroup.name.toLowerCase(),
          action: "UPDATED",
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

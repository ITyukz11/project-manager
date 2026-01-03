import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { put } from "@vercel/blob";
import { emitTransactionUpdated } from "@/actions/server/emitTransactionUpdated";
import { pusher } from "@/lib/pusher";
import { emitCashinUpdated } from "@/actions/server/emitCashinUpdated";

const ALLOWED_STATUS = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "CLAIMED",
  "ACCOMMODATING",
];

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

    // Parse FormData
    const formData = await req.formData();
    const status = formData.get("status") as string;
    const remarks = formData.get("remarks") as string | null;
    const receiptFile = formData.get("receipt") as File | null;
    const casinoGroupName =
      (formData.get("casinoGroup") as string | null) || "";

    // Status Validity
    if (!status || !ALLOWED_STATUS.includes(status)) {
      return NextResponse.json(
        {
          error: `Invalid status. Must be ${ALLOWED_STATUS.join(", ")}.`,
        },
        { status: 400 }
      );
    }

    // Get transaction
    const existingTransaction = await prisma.transactionRequest.findUnique({
      where: { id },
      include: { casinoGroup: { select: { name: true, id: true } } },
    });
    if (!existingTransaction) {
      return NextResponse.json(
        { error: "Transaction not found." },
        { status: 404 }
      );
    }

    // Cashout approval requires a receipt
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

    // Upload receipt if provided and valid
    let receiptUrl = existingTransaction.receiptUrl;
    if (receiptFile) {
      if (!receiptFile.type.startsWith("image/")) {
        return NextResponse.json(
          { error: "Receipt must be an image file." },
          { status: 400 }
        );
      }
      if (receiptFile.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: "Receipt file size must be less than 5MB." },
          { status: 400 }
        );
      }
      try {
        const blob = await put(
          `receipts/${id}-${Date.now()}-${receiptFile.name}`,
          receiptFile,
          { access: "public", addRandomSuffix: true }
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

    // Update transaction
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
          select: { id: true, name: true, username: true, role: true },
        },
        casinoGroup: true,
      },
    });

    // If ACCOMMODATING and has linked Cashin, update cashin status and emit update
    if (status === "ACCOMMODATING" && updatedTransaction.cashInId) {
      await Promise.all([
        prisma.cashin.update({
          where: { id: updatedTransaction.cashInId },
          data: { status: "ACCOMMODATING" },
        }),
        emitCashinUpdated({
          transactionId: existingTransaction.id,
          casinoGroup: casinoGroupName.toLocaleLowerCase(),
          action: "UPDATED",
        }),
      ]);
    }

    // Count pending and accommodating transactions/cashins in this casinoGroup
    const [pendingCount, pendingCountCashin] = await Promise.all([
      prisma.transactionRequest.count({
        where: {
          status: { in: ["PENDING", "CLAIMED", "ACCOMMODATING"] },
          casinoGroupId: existingTransaction.casinoGroup.id,
        },
      }),
      prisma.cashin.count({
        where: {
          status: { in: ["ACCOMMODATING"] },
          casinoGroupId: existingTransaction.casinoGroup.id,
        },
      }),
    ]);

    // Pusher event for count
    await pusher.trigger(
      `transaction-${existingTransaction.casinoGroup.name.toLowerCase()}`,
      "transaction-pending-count",
      { count: pendingCount }
    );

    // Pusher event for count
    await pusher.trigger(
      `cashin-${existingTransaction.casinoGroup.name.toLowerCase()}`,
      "cashin-pending-count",
      { count: pendingCountCashin }
    );

    // Emit transaction update event
    await emitTransactionUpdated({
      transactionId: existingTransaction.id,
      casinoGroup: casinoGroupName.toLocaleLowerCase(),
      action: "UPDATED",
    });

    return NextResponse.json(updatedTransaction);
  } catch (e: any) {
    console.error("Transaction update error:", e);
    return NextResponse.json(
      { error: e.message || "Failed to update transaction." },
      { status: 500 }
    );
  }
}

// GET single transaction (optimized)
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const transaction = await prisma.transactionRequest.findUnique({
      where: { id },
      include: {
        processedBy: {
          select: { id: true, name: true, username: true, role: true },
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

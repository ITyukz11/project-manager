import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { put } from "@vercel/blob";
import { emitTransactionUpdated } from "@/actions/server/emitTransactionUpdated";
import { pusher } from "@/lib/pusher";
import { emitCashinUpdated } from "@/actions/server/emitCashinUpdated";
import { createTransaction } from "@/lib/qbet88/createTransaction";

const ALLOWED_STATUS = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "CLAIMED",
  "ACCOMMODATING",
];

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
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
    const externalUserId = formData.get("externalUserId") as string;
    const casinoGroupName =
      (formData.get("casinoGroup") as string | null) || "";

    if (!status || !ALLOWED_STATUS.includes(status)) {
      return NextResponse.json(
        {
          error: `Invalid status. Must be ${ALLOWED_STATUS.join(", ")}.`,
        },
        { status: 400 },
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
        { status: 404 },
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
        { status: 400 },
      );
    }

    // Upload receipt if provided and valid
    let receiptUrl = existingTransaction.receiptUrl;
    if (receiptFile) {
      if (!receiptFile.type.startsWith("image/")) {
        return NextResponse.json(
          { error: "Receipt must be an image file." },
          { status: 400 },
        );
      }
      if (receiptFile.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: "Receipt file size must be less than 5MB." },
          { status: 400 },
        );
      }
      try {
        const blob = await put(
          `receipts/${id}-${Date.now()}-${receiptFile.name}`,
          receiptFile,
          { access: "public", addRandomSuffix: true },
        );
        receiptUrl = blob.url;
      } catch (uploadError: any) {
        console.error("Receipt upload error:", uploadError);
        return NextResponse.json(
          { error: "Failed to upload receipt." },
          { status: 500 },
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

    // ⏬⏬⏬ ---- CALL CREATE TRANSACTION IF "APPROVED" AND A DEPOSIT ---- ⏬⏬⏬
    if (status === "APPROVED" && existingTransaction.type === "CASHIN") {
      console.log("externalUserId:", externalUserId);
      // Call createTransaction
      // you might want to wrap this in a try/catch (optional)
      const trxnResult = await createTransaction({
        id: externalUserId, //user.externalId for player,
        txn: updatedTransaction.id, // use appropriate field for "txn"
        type: "DEPOSIT",
        amount: updatedTransaction.amount,
      });

      // You can customize response or handle errors/logs
      if (!trxnResult.ok) {
        console.error("createTransaction failed:", trxnResult);
        // Optionally: undo approval, mark as error, or return error response
        // return NextResponse.json({ error: "Transaction API failed.", details: trxnResult }, { status: 502 });
      }
      if (trxnResult.code !== 0) {
        console.error(
          "createTransaction error code:",
          trxnResult.code,
          "details:",
          trxnResult,
        );
        // Optionally: undo approval, mark as error, or return error response
        // return NextResponse.json({ error: `Transaction failed with code: ${trxnResult.code} or ${QBET_TRANSACTION_ERROR_MESSAGES[trxnResult.code as number] || 'Unknown error'}`, details: trxnResult }, { status: 400 });
      }
    }
    // ⏫⏫⏫ ---- END CREATE TRANSACTION LOGIC ---- ⏫⏫⏫

    // If ACCOMMODATING and has linked Cashin, update cashin status and emit update
    if (status === "ACCOMMODATING" && updatedTransaction.cashInId) {
      const cashinId = updatedTransaction.cashInId;

      // Use transaction for atomic updates
      await prisma.$transaction([
        prisma.cashin.update({
          where: { id: cashinId },
          data: {
            status: "ACCOMMODATING",
            externalUserId: externalUserId || undefined,
          },
        }),
      ]);
      emitCashinUpdated({
        transactionId: existingTransaction.id,
        casinoGroup: casinoGroupName.toLocaleLowerCase(),
        action: "UPDATED",
      });
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

    await pusher.trigger(
      `transaction-${existingTransaction.casinoGroup.name.toLowerCase()}`,
      "transaction-pending-count",
      { count: pendingCount },
    );

    await pusher.trigger(
      `cashin-${existingTransaction.casinoGroup.name.toLowerCase()}`,
      "cashin-pending-count",
      { count: pendingCountCashin },
    );

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
      { status: 500 },
    );
  }
}

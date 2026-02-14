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
    const referrer = (formData.get("referrer") as string) || "";
    const casinoGroupName = (
      (formData.get("casinoGroup") as string) || ""
    ).toLowerCase();

    if (!status || !ALLOWED_STATUS.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be ${ALLOWED_STATUS.join(", ")}.` },
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

    // Cashout approval requires receipt
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

    // Upload receipt if provided
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

    // Begin atomic transaction
    const updatedTransaction = await prisma.$transaction(async (tx) => {
      // 1️⃣ Update the transactionRequest first
      const updated = await tx.transactionRequest.update({
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

      // 2️⃣ Handle CASHIN approval
      if (status === "APPROVED" && existingTransaction.type === "CASHIN") {
        if (casinoGroupName !== "ran") {
          // QBET API
          const trxnResult = await createTransaction({
            id: externalUserId,
            txn: updated.id,
            type: "DEPOSIT",
            amount: updated.amount,
          });
          if (!trxnResult.ok || trxnResult.code !== 0) {
            console.error("QBET transaction failed:", trxnResult);
            throw new Error(`QBET transaction failed`);
          }
        } else {
          console.log(
            `Processing RAN top-up for user ${externalUserId} with amount ${updated.amount} and referrer "${referrer}"`,
          );
          console.log("Other:", receiptUrl, referrer);
          console.log("RAN API URL:", process.env.RAN_BASE_URL);
          console.log("RAN API Token:", process.env.RAN_API_TOKEN);

          // Validate inputs
          const chaNum = Number(externalUserId);
          const topUpPoints = Number(updated.amount);

          if (isNaN(chaNum)) throw new Error("Invalid id!");
          if (isNaN(topUpPoints))
            throw new Error("Invalid topUpPoints: not a number");

          const ranResponse = await fetch(
            `${process.env.RAN_BASE_URL}/api/TopUpReceive`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chaNum, // must be a valid integer
                topUpPoints, // must be a number
                referral: (referrer || "").trim(),
                referenceNumber: receiptUrl,
                tokenApi: process.env.RAN_API_TOKEN,
              }),
            },
          );

          const ranResult = await ranResponse.json();
          if (!ranResult.success) {
            console.error("RAN Top-up failed:", ranResult);
            throw new Error(
              `RAN Top-up failed: ${ranResult.message || JSON.stringify(ranResult)}`,
            );
          }

          console.log("RAN Top-up successful:", ranResult);
        }
      }

      // 3️⃣ If ACCOMMODATING with linked Cashin
      if (status === "ACCOMMODATING" && updated.cashInId) {
        await tx.cashin.update({
          where: { id: updated.cashInId },
          data: {
            status: "ACCOMMODATING",
            externalUserId: externalUserId || undefined,
          },
        });
      }

      return updated;
    }); // End of $transaction

    // Emit events (outside transaction)
    if (status === "ACCOMMODATING" && updatedTransaction.cashInId) {
      emitCashinUpdated({
        transactionId: existingTransaction.id,
        casinoGroup: casinoGroupName.toLocaleLowerCase(),
        action: "UPDATED",
      });
    }

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
      `transaction-${casinoGroupName}`,
      "transaction-pending-count",
      { count: pendingCount },
    );
    await pusher.trigger(
      `cashin-${casinoGroupName.toLocaleLowerCase()}`,
      "cashin-pending-count",
      {
        count: pendingCountCashin,
      },
    );

    await emitTransactionUpdated({
      transactionId: existingTransaction.id,
      casinoGroup: casinoGroupName,
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

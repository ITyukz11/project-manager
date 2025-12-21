import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { emitTransactionUpdated } from "@/actions/server/emitTransactionUpdated";
import { emitCashoutUpdated } from "@/actions/server/emitCashoutUpdated";
import { ADMINROLES } from "@/lib/types/role";
import { pusher } from "@/lib/pusher";
import { put } from "@vercel/blob";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const formData = await req.formData();
    const userName = formData.get("userName") as string;
    const amountStr = formData.get("amount");
    const details = formData.get("details") as string;
    const casinoGroupName = formData.get("casinoGroup") as string;
    const status = formData.get("status") as string;

    // Input validation — unchanged, yours looks good

    // Fetch casino group (as before)
    const casinoGroup = await prisma.casinoGroup.findFirst({
      where: { name: { equals: casinoGroupName, mode: "insensitive" } },
    });
    if (!casinoGroup) {
      return NextResponse.json(
        { error: "Invalid casino group specified." },
        { status: 400 }
      );
    }

    // More validation as before...
    if (!userName || typeof userName !== "string" || userName.trim() === "") {
      return NextResponse.json(
        { error: "Username is required." },
        { status: 400 }
      );
    }
    if (!amountStr || isNaN(Number(amountStr))) {
      return NextResponse.json({ error: "Invalid amount." }, { status: 400 });
    }
    const amount = parseFloat(amountStr as string);
    if (amount <= 0) {
      return NextResponse.json(
        { error: "Amount must be greater than zero." },
        { status: 400 }
      );
    }
    if (!details || typeof details !== "string" || details.trim() === "") {
      return NextResponse.json(
        { error: "Cashout details are required." },
        { status: 400 }
      );
    }
    if (!status || status !== "CLAIMED") {
      return NextResponse.json(
        { error: "Invalid status. Must be CLAIMED only." },
        { status: 400 }
      );
    }

    // Upload attachments
    const attachments: File[] = formData.getAll("attachment") as File[];
    const attachmentData: {
      url: string;
      filename: string;
      mimetype: string;
    }[] = [];
    for (const file of attachments) {
      if (file && typeof file === "object" && file.size > 0) {
        try {
          const blob = await put(file.name, file, {
            access: "public",
            addRandomSuffix: true,
          });
          attachmentData.push({
            url: blob.url,
            filename: file.name,
            mimetype: file.type || "",
          });
        } catch (err) {
          console.error("Attachment upload error:", err);
          return NextResponse.json(
            { error: "Attachment upload failed." },
            { status: 500 }
          );
        }
      }
    }

    const existingTransaction = await prisma.transactionRequest.findUnique({
      where: { id },
      include: { casinoGroup: { select: { name: true } } },
    });
    if (!existingTransaction) {
      return NextResponse.json(
        { error: "Transaction not found." },
        { status: 404 }
      );
    }

    // --- Prisma Transaction ---
    let cashout;
    try {
      cashout = await prisma.$transaction(async (tx) => {
        const createdCashout = await tx.cashout.create({
          data: {
            userName,
            amount,
            details,
            casinoGroupId: casinoGroup.id,
            userId: currentUser.id,
            transactionRequestId: existingTransaction.id,
            attachments: {
              createMany: {
                data: attachmentData,
              },
            },
          },
        });
        await tx.transactionRequest.update({
          where: { id },
          data: {
            status,
            processedById: currentUser.id,
            processedAt: new Date(),
            receiptUrl:
              attachmentData.length > 0 ? attachmentData[0].url : null,
          },
        });
        await tx.cashoutLogs.create({
          data: {
            cashoutId: createdCashout.id,
            action: "PENDING",
            performedById: currentUser.id,
          },
        });
        return createdCashout;
      });
    } catch (dbErr: any) {
      console.error("DB error during cashout creation:", dbErr);
      return NextResponse.json(
        { error: "Failed to create cashout." },
        { status: 500 }
      );
    }

    // --- Post-DB: Notify and Emit Events ---
    try {
      // Trigger pending count for group
      const pendingCount = await prisma.cashout.count({
        where: { status: "PENDING", casinoGroupId: casinoGroup.id },
      });
      await pusher.trigger(
        `cashout-${casinoGroupName.toLowerCase()}`,
        "cashout-pending-count",
        { count: pendingCount }
      );

      // Notify tagged users
      const taggedUsers = await prisma.user.findMany({
        where: {
          role: {
            in: [
              ADMINROLES.SUPERADMIN,
              ADMINROLES.ADMIN,
              ADMINROLES.ACCOUNTING,
              ADMINROLES.LOADER,
              ADMINROLES.TL,
            ],
          },
        },
        select: { id: true },
      });

      await Promise.all(
        taggedUsers.map(async (user) => {
          const notification = await prisma.notifications.create({
            data: {
              userId: user.id,
              message: `${currentUser.username} requested a Cashout: "${cashout.amount}" in ${casinoGroupName}.`,
              link: `/${casinoGroupName.toLowerCase()}/cash-outs/${cashout.id}`,
              isRead: false,
              type: "cashout",
              actor: currentUser.username,
              subject: cashout.amount.toLocaleString(),
              casinoGroup: casinoGroupName,
            },
          });
          await pusher.trigger(
            `user-notify-${user.id}`,
            "notifications-event",
            notification
          );
        })
      );

      // Custom emit handlers
      await emitTransactionUpdated({
        transactionId: existingTransaction.id,
        casinoGroup: existingTransaction.casinoGroup.name.toLowerCase(),
        action: "UPDATED",
      });
      await emitCashoutUpdated({
        transactionId: cashout.id,
        casinoGroup: casinoGroupName,
        action: "CREATED",
      });
    } catch (notifyErr: any) {
      // You may want to log but NOT return 500 here, since DB changes succeeded
      console.error("Notification error:", notifyErr);
    }

    return NextResponse.json({ success: true, result: cashout });
  } catch (err: any) {
    console.error("Transaction update error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to update transaction." },
      { status: 500 }
    );
  }
}

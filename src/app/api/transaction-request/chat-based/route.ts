import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { pusher } from "@/lib/pusher";
import { ADMINROLES } from "@/lib/types/role";
import { emitTransactionUpdated } from "@/actions/server/emitTransactionUpdated";

function validateApiKey(req: Request): {
  isValid: boolean;
  keyName?: string;
  error?: string;
} {
  const authHeader = req.headers.get("authorization");

  if (!authHeader) {
    return { isValid: false, error: "Missing Authorization header" };
  }

  let apiKey = "";
  if (authHeader.startsWith("Bearer ")) {
    apiKey = authHeader.substring(7);
  } else if (authHeader.startsWith("ApiKey ")) {
    apiKey = authHeader.substring(7);
  } else {
    apiKey = authHeader;
  }

  if (!apiKey || apiKey.trim() === "") {
    return {
      isValid: false,
      error: "Invalid Authorization format.  Use:  Bearer YOUR_API_KEY",
    };
  }

  const validKeys =
    process.env.BANKING_API_KEYS?.split(",").map((k) => k.trim()) || [];

  if (validKeys.length === 0) {
    console.error("❌ No API keys configured in environment!");
    return { isValid: false, error: "API authentication not configured" };
  }

  if (!validKeys.includes(apiKey)) {
    console.warn(`⚠️ Invalid API key attempt: ${apiKey.substring(0, 10)}...`);
    return { isValid: false, error: "Invalid API key" };
  }

  let keyName = "unknown";
  if (apiKey === process.env.BANKING_API_KEY_MASTER) {
    keyName = "master";
  } else if (apiKey === process.env.BANKING_API_KEY_PARTNER1) {
    keyName = "partner1";
  } else if (apiKey === process.env.BANKING_API_KEY_PARTNER2) {
    keyName = "partner2";
  } else if (apiKey === process.env.NEXT_PUBLIC_BANKING_API_KEY) {
    keyName = "public";
  }

  return { isValid: true, keyName };
}

function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  return forwarded?.split(",")[0] || realIp || "unknown";
}

// POST handler
export async function POST(req: Request) {
  try {
    // ===== SECURITY CHECKS (unchanged) =====
    const authResult = validateApiKey(req);

    if (!authResult.isValid) {
      console.warn(`🔒 Authentication failed: ${authResult.error}`);
      return NextResponse.json(
        {
          error: "Unauthorized.  Invalid or missing API key.",
          details: authResult.error,
        },
        { status: 401 }
      );
    }

    console.log(`🔑 API Key validated:  ${authResult.keyName}`);

    const clientIp = getClientIp(req);
    const formData = await req.formData();

    const type = formData.get("type") as string;
    const balance = formData.get("balance") as string;
    const username = formData.get("username") as string;
    const externalUserId = formData.get("externalUserId") as string;
    const amountStr = formData.get("amount") as string;
    const bankDetails = formData.get("bankDetails") as string | null;
    const paymentMethod = formData.get("paymentMethod") as string | null;
    const casinoGroupName = formData.get("casinoGroupName") as string;

    // Username checks
    const sanitizedUsername = username?.trim().toLowerCase() || "";

    if (!balance || balance.trim() === "") {
      return NextResponse.json(
        { error: "Balance is required.", field: "balance" },
        { status: 400 }
      );
    }
    if (!username || username.trim() === "") {
      return NextResponse.json(
        { error: "Username is required.", field: "username" },
        { status: 400 }
      );
    }
    if (!/^[a-z0-9_-]{3,30}$/i.test(sanitizedUsername)) {
      return NextResponse.json(
        {
          error:
            "Invalid username format. Use 3-30 characters (letters, numbers, underscore, hyphen).",
          field: "username",
        },
        { status: 400 }
      );
    }
    if (!amountStr || isNaN(Number(amountStr))) {
      return NextResponse.json(
        {
          error: "Amount is required and must be a valid number.",
          field: "amount",
        },
        { status: 400 }
      );
    }

    const parsedAmount = parseFloat(amountStr);

    // Casino group check
    const casinoGroup = await prisma.casinoGroup.findFirst({
      where: {
        name: { equals: casinoGroupName, mode: "insensitive" },
      },
    });

    if (!casinoGroup) {
      return NextResponse.json(
        { error: "Invalid casino group specified.", field: "casinoGroupName" },
        { status: 422 }
      );
    }

    // ===== CREATE TRANSACTION AND CASHIN =====
    const { transaction, cashin } = await prisma.$transaction(async (tx) => {
      const transaction = await tx.transactionRequest.create({
        data: {
          type,
          balance,
          username: sanitizedUsername,
          amount: parsedAmount,
          bankDetails: bankDetails || null,
          paymentMethod: paymentMethod || null,
          status: "PENDING",
          chatBased: true,
          casinoGroupId: casinoGroup.id,
          ipAddress: clientIp,
          userAgent: req.headers.get("user-agent") || null,
        },
      });

      const cashin = await tx.cashin.create({
        data: {
          amount: parsedAmount,
          userName: sanitizedUsername,
          externalUserId: externalUserId,
          status: "PENDING",
          details: `Chat-based ${type}`,
          casinoGroupId: casinoGroup.id,
          transactionRequestId: transaction.id,
          cashinThreads: {
            create: {
              authorId: "4694979a-0537-4efd-b1d6-e83e3366c7db",
              authorName: "Bot",
              message: `Good day!

I’m here to assist you with your cash-in request.

To send your payment, paki-upload o i-scan ang QR na ibibigay ko gamit ang inyong GCash app.

Paki-send po dito ang resibo pagkatapos.`,
              attachments: {
                create: {
                  url: "https://l4qltxdqdozpa9hu.public.blob.vercel-storage.com/Sec-QRPH-qr.png",
                  filename: "Sec-QRPH-qr.png",
                  mimetype: "image/png",
                },
              },
            },
          },
        },
      });

      await tx.transactionRequest.update({
        where: { id: transaction.id },
        data: { cashInId: cashin.id },
      });

      return { transaction, cashin };
    });

    // ====== SEND NOTIFICATIONS TO RELEVANT USERS =========
    const notifiedUsers = await prisma.user.findMany({
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
      cacheStrategy: { ttl: 60 * 10 },
    });

    // For each user, create the notification and send via Pusher
    await Promise.all(
      notifiedUsers.map(async (user) => {
        const notification = await prisma.notifications.create({
          data: {
            userId: user.id,
            message: `${sanitizedUsername} requested a ${type}: "amounting ${parsedAmount}" in ${casinoGroupName}.`,
            link: `/${casinoGroupName.toLowerCase()}/transaction-requests/${
              transaction.id
            }`,
            isRead: false,
            type: "transaction-request",
            actor: sanitizedUsername,
            subject: parsedAmount.toLocaleString() + " " + type,
            casinoGroup: casinoGroupName,
          },
        });

        await pusher.trigger(
          `user-notify-${user.id}`,
          "notifications-event",
          notification
        );

        await pusher.trigger(
          `chatbased-cashin-${cashin.id}`,
          "cashin:thread-updated",
          { cashin }
        );
      })
    );

    const pendingCount = await prisma.transactionRequest.count({
      where: {
        status: { in: ["PENDING", "CLAIMED", "ACCOMMODATING"] },
        casinoGroupId: casinoGroup.id,
      },
    });
    // Pusher event for count
    await pusher.trigger(
      `transaction-${casinoGroup.name.toLowerCase()}`,
      "transaction-pending-count",
      { count: pendingCount }
    );

    // ====== EMIT TRANSACTION UPDATED EVENT (ONCE ONLY) ======
    await emitTransactionUpdated({
      transactionId: transaction.id,
      casinoGroup: casinoGroup.name,
      action: "CREATED",
    });

    console.log(
      `✅ Transaction created: ${transaction.id} | ${type} | ${sanitizedUsername} | ₱${parsedAmount} | IP: ${clientIp} | API Key: ${authResult.keyName}`
    );

    return NextResponse.json(
      {
        success: true,
        transaction: {
          id: transaction.id,
          cashinId: cashin.id,
          type: transaction.type,
          amount: transaction.amount,
          status: transaction.status,
          createdAt: transaction.createdAt,
        },
        message: "Transaction request submitted successfully.",
      },
      { status: 201 }
    );
  } catch (e: any) {
    console.error("❌ Transaction creation error:", e);

    if (e?.name === "PrismaClientKnownRequestError") {
      return NextResponse.json(
        { error: "Database error. Please try again later." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create transaction request.  Please try again." },
      { status: 500 }
    );
  }
}

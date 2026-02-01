import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { pusher } from "@/lib/pusher";
import { put } from "@vercel/blob";
import crypto from "crypto";
import { ADMINROLES } from "@/lib/types/role";
import { emitTransactionUpdated } from "@/actions/server/emitTransactionUpdated";
import { toUtcEndOfDay, toUtcStartOfDay } from "@/lib/utils/utc.utils";

const STATUS_SORT = {
  PENDING: 1,
  CLAIMED: 2,
  ACCOMMODATING: 3,
};

// In-memory rate limiting (use Redis in production)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Transaction limits
const TRANSACTION_LIMITS = {
  minAmount: 5,
  maxAmount: 50000,
  dailyLimit: 1000, // Max 1000 transactions per day per user
};

// ============================================
// UPDATED:  More realistic rate limits
// ============================================
function getRateLimitForKey(keyName?: string): {
  windowMs: number;
  maxRequests: number;
} {
  if (keyName === "public") {
    // Public banking page users
    return {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 50, // 50 requests per 15 minutes
    };
  }

  if (keyName === "partner1" || keyName === "partner2") {
    // Partner integrations
    return {
      windowMs: 1 * 60 * 1000, // 1 minute
      maxRequests: 100, // 100 requests per minute
    };
  }

  if (keyName === "master") {
    // Internal/admin operations
    return {
      windowMs: 1 * 60 * 1000, // 1 minute
      maxRequests: 500, // Very high limit
    };
  }

  // Default for unknown keys (strict)
  return {
    windowMs: 15 * 60 * 1000,
    maxRequests: 10,
  };
}

// ============================================
// UPDATED:  Separate rate limits for IP and Username
// ============================================
function checkRateLimit(identifier: string, keyName?: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);
  const rateLimitConfig = getRateLimitForKey(keyName);

  if (!record || now > record.resetTime) {
    // New window
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + rateLimitConfig.windowMs,
    });
    return true;
  }

  if (record.count >= rateLimitConfig.maxRequests) {
    return false; // Rate limit exceeded
  }

  record.count++;
  return true;
}

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

async function hashFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hash = crypto.createHash("sha256");
  hash.update(Buffer.from(buffer));
  return hash.digest("hex");
}

function isValidImageFile(file: File): boolean {
  const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!validTypes.includes(file.type)) {
    return false;
  }

  if (file.size > maxSize) {
    return false;
  }

  return true;
}

function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  return forwarded?.split(",")[0] || realIp || "unknown";
}

// GET handler
export async function GET(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const casinoGroup = url.searchParams.get("casinoGroup");
    const type = url.searchParams.get("type");
    const fromParam = url.searchParams.get("from");
    const toParam = url.searchParams.get("to");

    // Convert fromParam and toParam to start/end of day if only date is given
    let fromDate: Date | undefined;
    let toDate: Date | undefined;

    if (fromParam) {
      // old: fromDate = new Date(f.getFullYear(), f.getMonth(), f.getDate(), 0,0,0,0)
      fromDate = toUtcStartOfDay(fromParam, 8); // 8 = UTC+8
    }

    if (toParam) {
      toDate = toUtcEndOfDay(toParam, 8);
    }

    if (!fromParam || !toParam) {
      return NextResponse.json(
        { error: "Both 'from' and 'to' query parameters are required." },
        { status: 400 },
      );
    }

    // Build business logic filter
    const whereClause: any = {
      OR: [
        { status: { in: ["PENDING", "CLAIMED", "ACCOMMODATING"] } },
        {
          NOT: { status: { in: ["PENDING", "CLAIMED", "ACCOMMODATING"] } },
          ...(fromDate || toDate
            ? {
                createdAt: {
                  ...(fromDate && { gte: fromDate }),
                  ...(toDate && { lte: toDate }),
                },
              }
            : {}),
        },
      ],
      ...(casinoGroup && {
        casinoGroup: {
          name: { equals: casinoGroup, mode: "insensitive" },
        },
      }),
    };

    if (type) {
      whereClause.type = type;
    }

    const transactions = await prisma.transactionRequest.findMany({
      where: whereClause,
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
      orderBy: { createdAt: "desc" },
    });

    transactions.sort((a, b) => {
      const aPriority = STATUS_SORT[a.status] ?? 99;
      const bPriority = STATUS_SORT[b.status] ?? 99;

      // 1️⃣ Status priority
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }

      // 2️⃣ Date (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return NextResponse.json(transactions);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST handler
export async function POST(req: Request) {
  try {
    // ============================================
    // SECURITY CHECK 0: API Key Authentication
    // ============================================
    const authResult = validateApiKey(req);

    if (!authResult.isValid) {
      console.warn(`🔒 Authentication failed: ${authResult.error}`);
      return NextResponse.json(
        {
          error: "Unauthorized.  Invalid or missing API key.",
          details: authResult.error,
        },
        { status: 401 },
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
    const receiptFile = formData.get("receipt") as File | null;

    // ============================================
    // SECURITY CHECK 1: Rate Limiting by IP
    // ============================================
    const ipRateLimitKey = `ip:${clientIp}: ${authResult.keyName}`;
    if (!checkRateLimit(ipRateLimitKey, authResult.keyName)) {
      const limits = getRateLimitForKey(authResult.keyName);
      const waitMinutes = Math.ceil(limits.windowMs / 60000);

      return NextResponse.json(
        {
          error: `Too many requests from your IP address. Please try again in ${waitMinutes} minute${
            waitMinutes > 1 ? "s" : ""
          }. `,
          retryAfter: Math.ceil(limits.windowMs / 1000),
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil(limits.windowMs / 1000)),
          },
        },
      );
    }

    // ============================================
    // SECURITY CHECK 2: Rate Limiting by Username
    // ============================================
    const sanitizedUsername = username?.trim().toLowerCase() || "";
    const userRateLimitKey = `user:${sanitizedUsername}:${authResult.keyName}`;

    if (!checkRateLimit(userRateLimitKey, authResult.keyName)) {
      const limits = getRateLimitForKey(authResult.keyName);
      const waitMinutes = Math.ceil(limits.windowMs / 60000);

      return NextResponse.json(
        {
          error: `Too many requests for this username. Please try again in ${waitMinutes} minute${
            waitMinutes > 1 ? "s" : ""
          }. `,
          retryAfter: Math.ceil(limits.windowMs / 1000),
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil(limits.windowMs / 1000)),
          },
        },
      );
    }

    // ============================================
    // VALIDATION:  Basic Input Validation
    // ============================================
    if (!type || !["CASHIN", "CASHOUT"].includes(type)) {
      return NextResponse.json(
        {
          error: "Invalid transaction type. Must be CASHIN or CASHOUT.",
          field: "type",
        },
        { status: 400 },
      );
    }

    if (!username || username.trim() === "") {
      return NextResponse.json(
        {
          error: "Username is required.",
          field: "username",
        },
        { status: 400 },
      );
    }

    if (!/^[a-z0-9_-]{3,30}$/i.test(sanitizedUsername)) {
      return NextResponse.json(
        {
          error:
            "Invalid username format. Use 3-30 characters (letters, numbers, underscore, hyphen).",
          field: "username",
        },
        { status: 400 },
      );
    }

    if (!amountStr || isNaN(Number(amountStr))) {
      return NextResponse.json(
        {
          error: "Amount is required and must be a valid number.",
          field: "amount",
        },
        { status: 400 },
      );
    }

    const parsedAmount = parseFloat(amountStr);

    if (parsedAmount < TRANSACTION_LIMITS.minAmount) {
      return NextResponse.json(
        {
          error: `Minimum transaction amount is ₱${TRANSACTION_LIMITS.minAmount}.`,
          field: "amount",
          minAmount: TRANSACTION_LIMITS.minAmount,
        },
        { status: 422 },
      );
    }

    if (parsedAmount > TRANSACTION_LIMITS.maxAmount) {
      return NextResponse.json(
        {
          error: `Maximum transaction amount is ₱${TRANSACTION_LIMITS.maxAmount}.`,
          field: "amount",
          maxAmount: TRANSACTION_LIMITS.maxAmount,
        },
        { status: 422 },
      );
    }

    if (type === "CASHOUT" && !bankDetails) {
      return NextResponse.json(
        {
          error: "Bank details are required for cash out.",
          field: "bankDetails",
        },
        { status: 400 },
      );
    }

    if (type === "CASHIN" && !receiptFile) {
      return NextResponse.json(
        {
          error: "Receipt is required for cash in.",
          field: "receipt",
        },
        { status: 400 },
      );
    }

    // ============================================
    // SECURITY CHECK 3: Validate Casino Group
    // ============================================
    const casinoGroup = await prisma.casinoGroup.findFirst({
      where: {
        name: { equals: casinoGroupName, mode: "insensitive" },
      },
    });

    if (!casinoGroup) {
      return NextResponse.json(
        {
          error: "Invalid casino group specified.",
          field: "casinoGroupName",
        },
        { status: 422 },
      );
    }

    // ============================================
    // SECURITY CHECK 4: Daily Transaction Limit
    // ============================================
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const todayTransactionCount = await prisma.transactionRequest.count({
      where: {
        username: sanitizedUsername,
        casinoGroupId: casinoGroup.id,
        createdAt: {
          gte: startOfDay,
        },
      },
    });

    if (todayTransactionCount >= TRANSACTION_LIMITS.dailyLimit) {
      return NextResponse.json(
        {
          error: `Daily transaction limit (${TRANSACTION_LIMITS.dailyLimit}) reached.  Please try again tomorrow.`,
          currentCount: todayTransactionCount,
          dailyLimit: TRANSACTION_LIMITS.dailyLimit,
        },
        { status: 429 },
      );
    }

    // ============================================
    // SECURITY CHECK 5: Duplicate Transaction Detection
    // ============================================
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentDuplicate = await prisma.transactionRequest.findFirst({
      where: {
        username: sanitizedUsername,
        amount: parsedAmount,
        type: type,
        casinoGroupId: casinoGroup.id,
        createdAt: {
          gte: fiveMinutesAgo,
        },
      },
    });

    if (recentDuplicate) {
      return NextResponse.json(
        {
          error:
            "Duplicate transaction detected. Please wait 5 minutes before submitting the same transaction again.",
          duplicateTransactionId: recentDuplicate.id,
          retryAfter: 300,
        },
        { status: 409 },
      );
    }

    // ============================================
    // SECURITY CHECK 6: Receipt File Validation
    // ============================================
    let receiptUrl: string | null = null;
    let receiptHash: string | null = null;

    if (receiptFile && receiptFile.size > 0) {
      if (!isValidImageFile(receiptFile)) {
        return NextResponse.json(
          {
            error:
              "Invalid receipt file.  Must be JPG, PNG, or WEBP under 5MB.",
            field: "receipt",
          },
          { status: 415 },
        );
      }

      try {
        receiptHash = await hashFile(receiptFile);

        const duplicateReceipt = await prisma.transactionRequest.findFirst({
          where: {
            receiptHash: receiptHash,
            status: {
              in: ["PENDING", "APPROVED"],
            },
          },
        });

        if (duplicateReceipt) {
          return NextResponse.json(
            {
              error:
                "This receipt has already been used for another transaction.",
              duplicateTransactionId: duplicateReceipt.id,
              field: "receipt",
            },
            { status: 409 },
          );
        }
      } catch (hashError) {
        console.error("Error hashing receipt:", hashError);
        return NextResponse.json(
          {
            error: "Failed to process receipt file.",
            details:
              hashError instanceof Error ? hashError.message : "Unknown error",
          },
          { status: 500 },
        );
      }

      try {
        const timestamp = Date.now();
        const sanitizedFilename = receiptFile.name.replace(
          /[^a-z0-9.-]/gi,
          "_",
        );
        const filename = `Transaction-Requests/${sanitizedUsername}-${timestamp}-${sanitizedFilename}`;

        const blob = await put(filename, receiptFile, {
          access: "public",
        });
        receiptUrl = blob.url;
      } catch (uploadError) {
        console.error("Receipt upload error:", uploadError);
        return NextResponse.json(
          {
            error: "Failed to upload receipt.  Please try again.",
            details: "Storage service temporarily unavailable",
          },
          { status: 503 },
        );
      }
    }

    // ============================================
    // CREATE TRANSACTION
    // ============================================
    const transaction = await prisma.transactionRequest.create({
      data: {
        type,
        balance,
        username: sanitizedUsername,
        externalUserId: externalUserId,
        amount: parsedAmount,
        bankDetails: bankDetails || null,
        paymentMethod: paymentMethod || null,
        receiptUrl: receiptUrl,
        receiptHash: receiptHash,
        status: "PENDING",
        casinoGroupId: casinoGroup.id,
        ipAddress: clientIp,
        userAgent: req.headers.get("user-agent") || null,
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

    // // Get all tagged users for this notification
    // // ============================================
    // // TRIGGER REAL-TIME NOTIFICATION
    // // ============================================
    const notifiedUsersId = await prisma.user
      .findMany({
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
          casinoGroups: {
            some: {
              id: casinoGroup.id, // 🔥 only users in this casino group
            },
          },
          active: true,
        },
        select: { id: true },
      })
      .then((users) => users.map((user) => user.id));

    await emitTransactionUpdated({
      transactionId: transaction.id,
      casinoGroup: casinoGroupName,
      action: "CREATED",
    });

    // // For each user, create the notification and send via Pusher
    await Promise.all(
      notifiedUsersId.map(async (userId) => {
        const notification = await prisma.notifications.create({
          data: {
            userId,
            message: `${sanitizedUsername} requested a ${type}: "amounting ${parsedAmount}" in ${casinoGroupName}.`,
            link: `/${casinoGroupName.toLowerCase()}/transaction-requests`,
            isRead: false,
            type: "transaction-request",
            actor: sanitizedUsername,
            subject: parsedAmount.toLocaleString() + " " + type,
            casinoGroup: casinoGroupName,
          },
        });

        //You can use a specific event name for this type
        await pusher.trigger(
          `user-notify-${userId}`,
          "notifications-event", // Event name by notification type
          notification,
        );
      }),
    );
    const pendingCount = await prisma.transactionRequest.count({
      where: {
        status: "PENDING",
        casinoGroupId: casinoGroup.id, // or use casinoGroupName if you join by name
      },
    });

    await pusher.trigger(
      `transaction-${casinoGroupName.toLowerCase()}`, // channel name
      "transaction-pending-count", // event name
      { count: pendingCount },
    );

    console.log(
      `✅ Transaction created: ${transaction.id} | ${type} | ${sanitizedUsername} | ₱${parsedAmount} | IP: ${clientIp} | API Key: ${authResult.keyName}`,
    );

    return NextResponse.json(
      {
        success: true,
        transaction: {
          id: transaction.id,
          type: transaction.type,
          amount: transaction.amount,
          status: transaction.status,
          createdAt: transaction.createdAt,
        },
        message: "Transaction request submitted successfully.",
      },
      { status: 201 },
    );
  } catch (e: any) {
    console.error("❌ Transaction creation error:", e);

    if (e.name === "PrismaClientKnownRequestError") {
      return NextResponse.json(
        { error: "Database error. Please try again later." },
        { status: 503 },
      );
    }

    return NextResponse.json(
      { error: "Failed to create transaction request.  Please try again." },
      { status: 500 },
    );
  }
}

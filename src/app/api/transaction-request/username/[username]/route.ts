import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// ============================================
// HELPER:  Validate API Key
// ============================================
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
      error: "Invalid Authorization format. Use:  Bearer YOUR_API_KEY",
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

  // Identify which key was used
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

// ============================================
// GET: Fetch transaction history by username
// ============================================
export async function GET(
  req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    // ============================================
    // SECURITY CHECK: API Key Authentication
    // ============================================
    const authResult = validateApiKey(req);

    if (!authResult.isValid) {
      console.warn(`🔒 Authentication failed:  ${authResult.error}`);
      return NextResponse.json(
        {
          error: "Unauthorized.  Invalid or missing API key.",
          details: authResult.error,
        },
        { status: 401 }
      );
    }

    console.log(`🔑 API Key validated:  ${authResult.keyName}`);

    // Get username from URL params
    const { username } = await params;

    if (!username || username.trim() === "") {
      return NextResponse.json(
        {
          error: "Username is required.",
        },
        { status: 400 }
      );
    }

    // Sanitize username
    const sanitizedUsername = username.trim().toLowerCase();

    // Optional: Get casino group from query params for filtering
    const url = new URL(req.url);
    const casinoGroup = url.searchParams.get("casinoGroup");

    // Build where clause
    const whereClause: Prisma.TransactionRequestWhereInput = {
      username: sanitizedUsername,
    };

    // Filter by casino group if provided
    if (casinoGroup) {
      whereClause.casinoGroup = {
        name: { equals: casinoGroup, mode: "insensitive" },
      };
    }

    // Fetch transactions for this username
    const transactions = await prisma.transactionRequest.findMany({
      where: whereClause,
      include: {
        casinoGroup: {
          select: { id: true, name: true },
        },
        processedBy: {
          select: {
            id: true,
            name: true,
            username: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: Prisma.SortOrder.desc,
      },
      take: 50, // Limit to last 50 transactions
    });

    // Log the request
    console.log(
      `📊 Transaction history requested:  ${sanitizedUsername} | Found:  ${transactions.length} | API Key: ${authResult.keyName}`
    );

    // Return transactions with summary
    return NextResponse.json(
      {
        success: true,
        username: sanitizedUsername,
        totalTransactions: transactions.length,
        transactions: transactions.map((t) => ({
          id: t.id,
          type: t.type,
          amount: t.amount,
          status: t.status,
          paymentMethod: t.paymentMethod,
          bankDetails: t.bankDetails,
          receiptUrl: t.receiptUrl,
          casinoGroup: t.casinoGroup.name,
          processedBy: t.processedBy
            ? {
                name: t.processedBy.name,
                username: t.processedBy.username,
              }
            : null,
          createdAt: t.createdAt,
          updatedAt: t.updatedAt,
        })),
      },
      { status: 200 }
    );
  } catch (e: any) {
    console.error("❌ Error fetching transaction history:", e);
    return NextResponse.json(
      {
        error: "Failed to fetch transaction history.  Please try again.",
        details: e.message,
      },
      { status: 500 }
    );
  }
}

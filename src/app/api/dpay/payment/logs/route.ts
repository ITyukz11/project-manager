import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Adjust import path as needed!
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (
    !session ||
    (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get casinoGroup and dateRange from URL search params
  const url = new URL(req.url);
  const casinoGroup = url.searchParams.get("casinoGroup");
  const fromParam = url.searchParams.get("from");
  const toParam = url.searchParams.get("to");

  let fromDate: Date | undefined;
  let toDate: Date | undefined;

  if (fromParam) {
    fromDate = new Date(fromParam); // already UTC
  }

  if (toParam) {
    toDate = new Date(toParam); // already UTC
  }

  // 🔧 If only one date is selected, expand to full PHT day
  if (fromDate && toDate && fromDate.getTime() === toDate.getTime()) {
    // add 23:59:59.999 in PHT
    toDate = new Date(fromDate.getTime() + 24 * 60 * 60 * 1000 - 1);
  }

  // Build "where" clause to match cashout/cashout logic, but adapted for cashin statuses
  const whereClause: any = {
    OR: [
      {
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

  console.log("WHERE CLAUSE:", JSON.stringify(whereClause, null, 2));
  try {
    // You can add more filters/orderBy/limit as needed
    const txns = await prisma.dpayTransaction.findMany({
      where: {
        ...whereClause,
        transactionNumber: {
          not: null,
        },
      },
      select: {
        id: true,
        userName: true,
        referenceUserId: true,
        amount: true,
        type: true,
        status: true,
        channel: true,
        paymentUrl: true,
        transactionNumber: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(txns);
  } catch (err) {
    console.error("Error fetching transactions:", err);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 },
    );
  }
}

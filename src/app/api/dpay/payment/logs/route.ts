import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Adjust import path as needed!
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get casinoGroup and dateRange from URL search params
  const url = new URL(req.url);
  const casinoGroup = url.searchParams.get("casinoGroup");
  const fromParam = url.searchParams.get("from");
  const toParam = url.searchParams.get("to");

  // Convert fromParam and toParam to start/end of day if only date is given
  let fromDate: Date | undefined;
  let toDate: Date | undefined;

  if (fromParam) {
    const f = new Date(fromParam);
    fromDate = new Date(f.getFullYear(), f.getMonth(), f.getDate(), 0, 0, 0, 0);
  }

  if (toParam) {
    const t = new Date(toParam);
    toDate = new Date(
      t.getFullYear(),
      t.getMonth(),
      t.getDate(),
      23,
      59,
      59,
      999,
    );
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
        qbetStatus: true,
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

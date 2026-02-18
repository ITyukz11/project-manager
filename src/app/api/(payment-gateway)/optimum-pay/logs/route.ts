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

  // Build "where" clause to match cashout/cashout logic, but adapted for cashin statuses
  const whereClause: any = {
    OR: [
      {
        ...(fromParam || toParam
          ? {
              createdAt: {
                ...(fromParam && { gte: fromParam }),
                ...(toParam && { lte: toParam }),
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
    const txns = await prisma.optimumPayTransaction.findMany({
      where: {
        ...whereClause,
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

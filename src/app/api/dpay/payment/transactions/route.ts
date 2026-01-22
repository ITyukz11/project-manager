import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json(
      { error: "Missing userId query parameter" },
      { status: 400 },
    );
  }

  try {
    const [txns, cashouts] = await Promise.all([
      prisma.dpayTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 15,
      }),
      prisma.transactionRequest.findMany({
        where: { externalUserId: userId },
        orderBy: { createdAt: "desc" },
        take: 15,
      }),
    ]);

    const normalizedTxns = txns.map((txn) => ({
      id: txn.id,
      source: "TRANSACTION", // 👈 helps frontend distinguish
      type: txn.type,
      amount: txn.amount,
      status: txn.status,
      createdAt: txn.createdAt,
      updatedAt: txn.updatedAt,
    }));

    const normalizedCashouts = cashouts.map((cashout) => ({
      id: cashout.id,
      source: "CASHOUT",
      type: "CASHOUT",
      amount: cashout.amount,
      status: cashout.status,
      remarks: cashout.remarks,
      createdAt: cashout.createdAt,
      updatedAt: cashout.updatedAt,
    }));

    const result = [...normalizedTxns, ...normalizedCashouts].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );

    return NextResponse.json(result);
  } catch (err) {
    console.error("Error fetching transactions:", err);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 },
    );
  }
}

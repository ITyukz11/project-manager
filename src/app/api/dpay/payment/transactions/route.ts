import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Adjust import path as needed!

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json(
      { error: "Missing userId query parameter" },
      { status: 400 }
    );
  }

  try {
    // You can add more filters/orderBy/limit as needed
    const txns = await prisma.dpayTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(txns);
  } catch (err) {
    console.error("Error fetching transactions:", err);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Transaction ID is required" },
        { status: 400 }
      );
    }

    // Fetch transaction with related data
    const transaction = await prisma.transactionRequest.findUnique({
      where: { id },
      include: {
        processedBy: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
          },
        },
        casinoGroup: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      transaction,
    });
  } catch (error: any) {
    console.error("Error fetching transaction details:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch transaction details" },
      { status: 500 }
    );
  }
}

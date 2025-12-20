import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CashoutStatus } from "@prisma/client";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const casinoGroupName = searchParams.get("casinoGroup");

  if (!casinoGroupName || casinoGroupName.trim() === "") {
    return NextResponse.json(
      { error: "Missing casinoGroup parameter." },
      { status: 400 }
    );
  }

  try {
    // Find the casino group by name (case-insensitive)
    const casinoGroup = await prisma.casinoGroup.findFirst({
      where: {
        name: { equals: casinoGroupName, mode: "insensitive" },
      },
    });

    if (!casinoGroup) {
      return NextResponse.json(
        { error: "Casino group not found." },
        { status: 404 }
      );
    }

    // ✅ Execute all counts in parallel using Promise.all
    const [
      cashoutCount,
      remittanceCount,
      concernCount,
      taskCount,
      transactionCount,
    ] = await Promise.all([
      // Cashout count
      prisma.cashout.count({
        where: {
          status: {
            in: [CashoutStatus.PENDING, CashoutStatus.PARTIAL],
          },
          casinoGroupId: casinoGroup.id,
        },
      }),

      // Remittance count
      prisma.remittance.count({
        where: {
          status: "PENDING", // Adjust based on your schema
          casinoGroupId: casinoGroup.id,
        },
      }),

      // Concern count
      prisma.concern.count({
        where: {
          status: "PENDING", // Adjust based on your schema
          casinoGroupId: casinoGroup.id,
        },
      }),

      // Task count
      prisma.task.count({
        where: {
          status: "PENDING", // Adjust based on your schema
          casinoGroupId: casinoGroup.id,
        },
      }),

      // Transaction Request count
      prisma.transactionRequest.count({
        where: {
          status: "PENDING", // Adjust based on your schema
          casinoGroupId: casinoGroup.id,
        },
      }),
    ]);

    return NextResponse.json({
      cashout: cashoutCount,
      remittance: remittanceCount,
      concern: concernCount,
      task: taskCount,
      transaction: transactionCount,
      total:
        cashoutCount +
        remittanceCount +
        concernCount +
        taskCount +
        transactionCount,
    });
  } catch (error) {
    console.error("Error fetching pending counts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

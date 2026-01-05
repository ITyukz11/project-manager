import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { emitTransactionUpdated } from "@/actions/server/emitTransactionUpdated";
import { emitCashinUpdated } from "@/actions/server/emitCashinUpdated";

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cashinId = (await params).id;

    if (!cashinId) {
      return NextResponse.json(
        { error: "Cashin ID is required" },
        { status: 400 }
      );
    }

    const existingCashin = await prisma.cashin.findUnique({
      where: { id: cashinId },
      select: {
        id: true,
        status: true,
        casinoGroup: {
          select: { name: true },
        },
      },
    });

    if (!existingCashin) {
      return NextResponse.json({ error: "Cashin not found" }, { status: 404 });
    }

    if (existingCashin.status === "COMPLETED") {
      return NextResponse.json(
        { message: "Cashin already completed" },
        { status: 200 }
      );
    }

    const result = await prisma.$transaction([
      prisma.cashin.update({
        where: { id: cashinId },
        data: {
          status: "COMPLETED",
        },
      }),
      prisma.transactionRequest.updateMany({
        where: {
          cashInId: cashinId,
          status: { in: ["PENDING", "ACCOMMODATING"] },
        },
        data: {
          status: "LEAVED",
        },
      }),
    ]);

    await emitTransactionUpdated({
      transactionId: cashinId,
      casinoGroup: existingCashin.casinoGroup.name,
      action: "UPDATED",
    });

    await emitCashinUpdated({
      transactionId: cashinId,
      casinoGroup: existingCashin.casinoGroup.name,
      action: "UPDATED",
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("[CASHIN_CLOSE_CHAT]", error);
    return NextResponse.json(
      { error: "Failed to close chat" },
      { status: 500 }
    );
  }
}

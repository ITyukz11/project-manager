import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const externalUserId = (await params).id;

  if (!externalUserId) {
    return NextResponse.json(
      { error: "Missing externalUserId" },
      { status: 400 },
    );
  }

  try {
    const hasPending = await prisma.transactionRequest.findFirst({
      where: {
        externalUserId,
        status: "PENDING",
      },
      select: { id: true }, // minimal + fast
    });

    return NextResponse.json({
      hasPending: !!hasPending,
    });
  } catch (error) {
    console.error("Error checking pending transaction request:", error);
    return NextResponse.json(
      { error: "Failed to check pending transaction request" },
      { status: 500 },
    );
  }
}

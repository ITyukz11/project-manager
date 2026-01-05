import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  console.log("Checking existence for casino group name:", id);
  if (!id) {
    return NextResponse.json(
      { error: "Casino group name is required." },
      { status: 400 }
    );
  }

  try {
    const exists = !!(await prisma.casinoGroup.findFirst({
      where: { name: { equals: id, mode: "insensitive" } },
      select: { id: true },
    }));
    return NextResponse.json({ exists });
  } catch (error) {
    return NextResponse.json(
      { error: "Server error.", details: (error as Error).message },
      { status: 500 }
    );
  }
}

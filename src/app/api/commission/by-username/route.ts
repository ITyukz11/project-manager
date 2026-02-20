import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userName = searchParams.get("userName");

    if (!userName) {
      return NextResponse.json(
        { error: "userName is required" },
        { status: 400 },
      );
    }

    const commissions = await prisma.commission.findMany({
      where: { userName },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(commissions);
  } catch (error) {
    console.error("COMMISSION_FETCH_ERROR", error);

    return NextResponse.json(
      { error: "Failed to fetch commissions" },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const casinoGroupName = searchParams.get("casinoGroupName");

    console.log("Fetching config for casino group:", casinoGroupName);
    if (!casinoGroupName) {
      return NextResponse.json(
        { error: "casinoGroupName is required" },
        { status: 400 },
      );
    }

    const casinoGroup = await prisma.casinoGroup.findFirst({
      where: {
        name: { equals: casinoGroupName, mode: "insensitive" },
      },
    });

    if (!casinoGroup) {
      return NextResponse.json(
        { error: "Casino group not found" },
        { status: 404 },
      );
    }

    const config = await prisma.dpayConfig.findUnique({
      where: { casinoGroupId: casinoGroup.id },
      select: {
        id: true,
        cashinGatewayEnabled: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(config);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

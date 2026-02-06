import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ADMINROLES } from "@/lib/types/role";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== ADMINROLES.SUPERADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { casinoGroupName, enabled } = await req.json();

    if (typeof enabled !== "boolean" || !casinoGroupName) {
      return NextResponse.json(
        { error: "casinoGroupName and enabled are required" },
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

    const config = await prisma.dpayConfig.update({
      where: { casinoGroupId: casinoGroup.id },
      data: { cashinGatewayEnabled: enabled },
    });

    return NextResponse.json(config);
  } catch (error) {
    console.error("DPAY TOGGLE ERROR:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

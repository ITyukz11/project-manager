import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ normalize username from URL
    const username = decodeURIComponent((await params).id).trim();

    const { searchParams } = new URL(req.url);
    const casino = searchParams.get("casino")?.trim();

    if (!username || !casino) {
      return NextResponse.json(
        {
          exists: false,
          error: "Username and casino are required",
        },
        { status: 400 }
      );
    }

    // ✅ query for only ACCOMMODATING status
    const existingCashin = await prisma.cashin.findFirst({
      where: {
        userName: {
          equals: username,
          mode: "insensitive", // casing safe
        },
        casinoGroup: {
          name: {
            equals: casino,
            mode: "insensitive", // casing safe
          },
        },
        status: "ACCOMMODATING", // only this status
      },
      orderBy: {
        createdAt: "desc", // deterministic
      },
      select: {
        id: true,
      },
    });

    const cashinGatewayChatbased = await prisma.transactionRequest.findFirst({
      where: {
        username: {
          equals: username,
          mode: "insensitive", // casing safe
        },
        paymentMethod: "Chat-Based",
        status: "PENDING",
      },
      orderBy: {
        createdAt: "desc", // deterministic
      },
      select: {
        id: true,
      },
    });

    return NextResponse.json({
      exists: !!existingCashin || !!cashinGatewayChatbased,
      cashinId: existingCashin?.id ?? null,
      existingCashin: existingCashin,
      cashinGatewayChatbased: cashinGatewayChatbased,
    });
  } catch (error) {
    console.error("Accommodating check error:", error);
    return NextResponse.json(
      {
        exists: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}

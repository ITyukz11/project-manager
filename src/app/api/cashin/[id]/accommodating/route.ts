import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const username = (await params).id;
    const { searchParams } = new URL(req.url);
    const casino = searchParams.get("casino");

    if (!username || !casino) {
      return NextResponse.json(
        {
          exists: false,
          error: "Username and casino are required",
        },
        { status: 400 }
      );
    }

    const existingCashin = await prisma.cashin.findFirst({
      where: {
        userName: username,
        casinoGroup: {
          name: casino, // 👈 adjust if you use casinoGroupId instead
        },
        status: {
          in: ["ACCOMMODATING"], // ✅ valid enum values
        },
      },
      select: {
        id: true,
      },
    });

    return NextResponse.json({
      exists: Boolean(existingCashin),
      cashinId: existingCashin?.id ?? null,
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

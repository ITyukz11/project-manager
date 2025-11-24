import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * GET /api/network/casino-group/[name]
 * Fetch a single casino group by unique name (case-insensitive), including counts and relations.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  if (!name) {
    return NextResponse.json(
      { error: "No casino group name specified." },
      { status: 400 }
    );
  }

  try {
    // Use findFirst with "insensitive" mode for case-insensitive search
    const group = await prisma.casinoGroup.findFirst({
      where: {
        name: {
          equals: name,
          mode: "insensitive",
        },
      },
    });

    if (!group) {
      return NextResponse.json(
        { error: "Casino group not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(group, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch casino group." },
      { status: 500 }
    );
  }
}

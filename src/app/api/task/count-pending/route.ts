import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // adjust import if needed

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const casinoGroupName = searchParams.get("casinoGroup");

  if (!casinoGroupName || casinoGroupName.trim() === "") {
    return NextResponse.json(
      { error: "Missing casinoGroup parameter." },
      { status: 400 }
    );
  }

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

  // Count pending tasks for this group
  const count = await prisma.task.count({
    where: {
      status: "PENDING",
      casinoGroupId: casinoGroup.id,
    },
  });

  return NextResponse.json({ count });
}

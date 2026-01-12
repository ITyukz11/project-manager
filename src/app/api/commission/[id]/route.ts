import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authentication (optional, keep for security)
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = (await params).id;
    if (!id) {
      return NextResponse.json({ error: "No ID provided" }, { status: 400 });
    }

    // Find the specific Commission by primary key
    const Commission = await prisma.commission.findUnique({
      where: { id },
      include: {
        attachments: true,
        commissionLogs: { include: { performedBy: true } },
        commissionThreads: {
          include: { author: true, attachments: true },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!Commission) {
      return NextResponse.json(
        { error: "Commission not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(Commission);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

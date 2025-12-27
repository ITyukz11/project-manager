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

    // Find the specific concern by primary key
    const remittance = await prisma.remittance.findUnique({
      where: { id },
      include: {
        user: true,
        attachments: true,
        remittanceLogs: { include: { performedBy: true } },
        remittanceThreads: {
          include: { author: true, attachments: true },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!remittance) {
      return NextResponse.json(
        { error: "Remittance not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(remittance);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

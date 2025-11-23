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

    // Find the specific cashout by primary key
    const cashout = await prisma.cashout.findUnique({
      where: { id },
      include: {
        user: true,
        attachments: true,
        cashoutLogs: { include: { performedBy: true } },
        cashoutThreads: {
          include: { author: true, attachments: true },
        },
      },
    });

    if (!cashout) {
      return NextResponse.json({ error: "Cashout not found" }, { status: 404 });
    }

    return NextResponse.json(cashout);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

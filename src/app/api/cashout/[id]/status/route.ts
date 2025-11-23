import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = (await params).id;
  const session = await getServerSession(authOptions); // must provide user object
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { status } = await req.json();
  if (!status) {
    return NextResponse.json({ error: "Missing status" }, { status: 400 });
  }

  try {
    // 1. Update the cashout status
    const cashout = await prisma.cashout.update({
      where: { id },
      data: { status },
    });

    // 2. Log this status change in CashoutLogs
    await prisma.cashoutLogs.create({
      data: {
        action: status, // record new status as the action (or use something like `Status changed to X`)
        cashoutId: id,
        performedById: session.user.id,
      },
    });

    return NextResponse.json({ success: true, cashout });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "An error occurred" },
      { status: 500 }
    );
  }
}

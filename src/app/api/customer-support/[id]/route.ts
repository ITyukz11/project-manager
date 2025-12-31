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

    // Find the specific customerSupport by primary key
    const customerSupport = await prisma.customerSupport.findUnique({
      where: { id },
      include: {
        user: true,
        attachments: true,
        customerSupportLogs: { include: { performedBy: true } },
        customerSupportThreads: {
          include: { author: true, attachments: true },
          orderBy: { createdAt: "asc" },
        },
        tagUsers: true,
      },
    });

    if (!customerSupport) {
      return NextResponse.json(
        { error: "CustomerSupport not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(customerSupport);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

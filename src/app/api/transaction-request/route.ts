import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { pusher } from "@/lib/pusher";
import { put } from "@vercel/blob";

const STATUS_SORT = {
  PENDING: 1,
  COMPLETED: 2,
  REJECTED: 3,
};

// GET handler remains the same
export async function GET(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const casinoGroup = url.searchParams.get("casinoGroup");
    const type = url.searchParams.get("type");

    const whereClause: any = {};

    if (casinoGroup) {
      whereClause.casinoGroup = {
        name: { equals: casinoGroup, mode: "insensitive" },
      };
    }

    if (type) {
      whereClause.type = type;
    }

    const transactions = await prisma.transactionRequest.findMany({
      where: whereClause,
      include: {
        processedBy: {
          select: {
            id: true,
            name: true,
            username: true,
            role: true,
          },
        },
        casinoGroup: true,
      },
      orderBy: { createdAt: "desc" },
    });

    transactions.sort((a, b) => STATUS_SORT[a.status] - STATUS_SORT[b.status]);

    return NextResponse.json(transactions);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST handler with file upload
export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const type = formData.get("type") as string;
    const username = formData.get("username") as string;
    const amountStr = formData.get("amount") as string;
    const bankDetails = formData.get("bankDetails") as string | null;
    const paymentMethod = formData.get("paymentMethod") as string | null;
    const casinoGroupName = formData.get("casinoGroupName") as string;
    const receiptFile = formData.get("receipt") as File | null;

    // Validation
    if (!type || !["CASHIN", "CASHOUT"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid transaction type.  Must be CASHIN or CASHOUT." },
        { status: 400 }
      );
    }

    if (!username || username.trim() === "") {
      return NextResponse.json(
        { error: "Username is required." },
        { status: 400 }
      );
    }

    if (!amountStr || isNaN(Number(amountStr))) {
      return NextResponse.json(
        { error: "Amount is required and must be a valid number." },
        { status: 400 }
      );
    }

    const parsedAmount = parseFloat(amountStr);
    if (parsedAmount <= 0) {
      return NextResponse.json(
        { error: "Amount must be greater than zero." },
        { status: 400 }
      );
    }

    if (type === "CASHOUT" && !bankDetails) {
      return NextResponse.json(
        { error: "Bank details are required for cash out." },
        { status: 400 }
      );
    }

    // Find casino group
    const casinoGroup = await prisma.casinoGroup.findFirst({
      where: {
        name: { equals: casinoGroupName, mode: "insensitive" },
      },
    });

    if (!casinoGroup) {
      return NextResponse.json(
        { error: "Invalid casino group specified." },
        { status: 400 }
      );
    }

    // Upload receipt if provided to Transaction-Requests folder
    let receiptUrl: string | null = null;
    if (receiptFile && receiptFile.size > 0) {
      try {
        const timestamp = Date.now();
        const filename = `Transaction-Requests/${username}-${timestamp}-${receiptFile.name}`;

        const blob = await put(filename, receiptFile, {
          access: "public",
        });
        receiptUrl = blob.url;
      } catch (uploadError) {
        console.error("Receipt upload error:", uploadError);
        return NextResponse.json(
          { error: "Failed to upload receipt." },
          { status: 500 }
        );
      }
    }

    // Create transaction request
    const transaction = await prisma.transactionRequest.create({
      data: {
        type,
        username: username.trim(),
        amount: parsedAmount,
        bankDetails: bankDetails || null,
        paymentMethod: paymentMethod || null,
        receiptUrl: receiptUrl,
        status: "PENDING",
        casinoGroupId: casinoGroup.id,
      },
      include: {
        processedBy: {
          select: {
            id: true,
            name: true,
            username: true,
            role: true,
          },
        },
        casinoGroup: true,
      },
    });

    // Trigger Pusher notification
    if (process.env.NEXT_PUBLIC_PUSHER_KEY && process.env.PUSHER_SECRET) {
      try {
        await pusher.trigger("transaction-request", "new-transaction", {
          id: transaction.id,
          type: transaction.type,
          username: transaction.username,
          amount: transaction.amount,
          casinoGroup: casinoGroup.name,
        });
      } catch (pusherErr) {
        console.error("Pusher error:", pusherErr);
      }
    }

    return NextResponse.json(transaction, { status: 201 });
  } catch (e: any) {
    console.error("Transaction creation error:", e);
    return NextResponse.json(
      { error: e.message || "Failed to create transaction request." },
      { status: 500 }
    );
  }
}

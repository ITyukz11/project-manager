import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      UserName,
      Channel,
      Amount,
      ReferenceUserId,
      NotificationUrl,
      SuccessRedirectUrl,
      CancelRedirectUrl,
      Type, // "CASHIN" or "CASHOUT" from frontend
    } = body;

    // Save initial transaction to your DB
    const txn = await prisma.dpayTransaction.create({
      data: {
        userId: ReferenceUserId,
        userName: UserName, // Add userName if available
        referenceUserId: ReferenceUserId,
        amount: Number(Amount),
        type: (Type || "CASHIN").toUpperCase(), // Dynamic for cashin/cashout
        status: "INITIATED",
        rawRequest: body,
        channel: Channel, // If you add this column to the model
      },
    });

    // Forward to your actual payment API (change BASE_URL as needed)
    const proxyResp = await fetch(
      `${process.env.BASE_URL}/api/droplet/payment/create-cashin`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );
    const data = await proxyResp.json();

    // Check for gateway call failure and reflect in DB
    if (!proxyResp.ok) {
      await prisma.dpayTransaction.update({
        where: { id: txn.id },
        data: {
          status: "FAILED",
          rawGatewayResponse: data,
        },
      });
      return NextResponse.json(
        { error: "Payment gateway call failed", details: data },
        { status: proxyResp.status }
      );
    }

    // Extract info & update DB
    const transactionNumber =
      data.TransactionNumber ||
      data.createCashin?.TransactionNumber ||
      data.createCashout?.TransactionNumber;
    const paymentUrl =
      data.PaymentUrl ||
      data.createCashin?.PaymentUrl ||
      data.createCashout?.PaymentUrl;

    await prisma.dpayTransaction.update({
      where: { id: txn.id },
      data: {
        transactionNumber,
        paymentUrl,
        status: "PENDING",
        rawGatewayResponse: data,
      },
    });

    // Return everything, plus our newly created txn id for tracking
    return NextResponse.json(
      { ...data, dpayTransactionId: txn.id },
      { status: proxyResp.status }
    );
  } catch (err: any) {
    console.error("Error saving dpay transaction:", err);
    return NextResponse.json(
      { error: "Error in payment process" },
      { status: 500 }
    );
  }
}

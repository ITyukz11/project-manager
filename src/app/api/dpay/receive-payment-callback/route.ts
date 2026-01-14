import { prisma } from "@/lib/prisma";
import { createTransaction } from "@/lib/qbet88/createTransaction";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();

  // TODO: Signature verification for production!
  // const isValid = verifySignature(body.Signature, body, process.env.YOUR_GATEWAY_SECRET);
  // if (!isValid) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });

  const {
    ReferenceUserId,
    Status,
    StatusDescription,
    Amount,
    TransactionNumber,
  } = body;

  try {
    if (!ReferenceUserId || !TransactionNumber || typeof Status === "undefined")
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );

    // Determine textual status for DB
    let txnStatus = "PENDING";
    if (Status === 3) txnStatus = "COMPLETED";
    else if (Status === 4) txnStatus = "REJECTED";
    else if (Status === 2) txnStatus = "PENDING"; // your gateway may send other intermediate codes

    // Update transaction record in DB
    await prisma.dpayTransaction.updateMany({
      where: { transactionNumber: TransactionNumber },
      data: {
        status: txnStatus,
        rawWebhook: body,
      },
    });

    if (Status === 3) {
      // Credit user's balance or mark transaction as successful
      const transactionRes = await createTransaction({
        id: ReferenceUserId,
        txn: TransactionNumber,
        type: "DEPOSIT",
        amount: Number(Amount),
      });

      if (
        transactionRes?.ok &&
        Array.isArray(transactionRes.data?.data) &&
        transactionRes.data.data[0]?.code === 0
      ) {
        const balanceAfter = transactionRes.data.data[0]?.balance_after;
        console.log(
          `[CASHIN SUCCESS] User: ${ReferenceUserId} Amount: ${Amount} Tx: ${TransactionNumber} NewBalance: ${balanceAfter}`
        );
      } else {
        console.error(
          `[CASHIN ERROR] Failed to credit balance for User: ${ReferenceUserId} Tx: ${TransactionNumber}. Response:`,
          JSON.stringify(transactionRes)
        );
        // Optionally, mark transaction as failed in DB here as well!
        await prisma.dpayTransaction.updateMany({
          where: { transactionNumber: TransactionNumber },
          data: {
            status: "FAILED",
            // Optionally add more debug info
          },
        });
        return NextResponse.json(
          { error: "Failed to record transaction", transactionRes },
          { status: 500 }
        );
      }
    } else if (Status === 4) {
      // Mark deposit as failed in your database
      console.log(
        `[CASHIN FAILED] User: ${ReferenceUserId} Tx: ${TransactionNumber} Reason: ${StatusDescription}`
      );
    } else {
      // Log or handle pending or other statuses
      console.log(
        `[CASHIN UPDATE] User: ${ReferenceUserId} Tx: ${TransactionNumber} Status: ${StatusDescription}`
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("PAYMENT CALLBACK ERROR", err);
    return NextResponse.json(
      { error: "Failed to process callback" },
      { status: 500 }
    );
  }
}

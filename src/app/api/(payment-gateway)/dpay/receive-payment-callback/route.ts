import { prisma } from "@/lib/prisma";
import { createTransaction } from "@/lib/qbet88/createTransaction";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();

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
        { status: 400 },
      );

    // Map gateway status to textual DB status
    let txnStatus = "PENDING";
    if (Status === 3) txnStatus = "COMPLETED";
    else if (Status === 4) txnStatus = "REJECTED";

    // Initial update: always store gateway status & webhook
    await prisma.dpayTransaction.updateMany({
      where: { transactionNumber: TransactionNumber },
      data: {
        status: txnStatus,
        rawWebhook: body,
        // qbetStatus remains PENDING unless rejected
        ...(Status === 4 ? { qbetStatus: "REJECTED" } : {}),
      },
    });

    if (Status === 3) {
      // Attempt to credit user's balance
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
          `[CASHIN SUCCESS] User: ${ReferenceUserId} Amount: ${Amount} Tx: ${TransactionNumber} NewBalance: ${balanceAfter}`,
        );

        // Mark qbetStatus as LOADED
        await prisma.dpayTransaction.updateMany({
          where: { transactionNumber: TransactionNumber },
          data: { qbetStatus: "LOADED" },
        });
      } else {
        console.error(
          `[CASHIN ERROR] Failed to credit balance for User: ${ReferenceUserId} Tx: ${TransactionNumber}. Response:`,
          JSON.stringify(transactionRes),
        );

        // Mark transaction as FAILED but leave qbetStatus PENDING
        await prisma.dpayTransaction.updateMany({
          where: { transactionNumber: TransactionNumber },
          data: { status: "FAILED" },
        });

        return NextResponse.json(
          { error: "Failed to record transaction", transactionRes },
          { status: 500 },
        );
      }
    } else if (Status === 4) {
      console.log(
        `[CASHIN FAILED] User: ${ReferenceUserId} Tx: ${TransactionNumber} Reason: ${StatusDescription}`,
      );
    } else {
      console.log(
        `[CASHIN UPDATE] User: ${ReferenceUserId} Tx: ${TransactionNumber} Status: ${StatusDescription}`,
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("PAYMENT CALLBACK ERROR", err);
    return NextResponse.json(
      { error: "Failed to process callback" },
      { status: 500 },
    );
  }
}

// import { prisma } from "@/lib/prisma";
// import { createTransaction } from "@/lib/qbet88/createTransaction";
// import { NextRequest, NextResponse } from "next/server";

// export async function POST(req: NextRequest) {
//   const body = await req.json();
//   const {
//     ReferenceUserId,
//     Status,
//     StatusDescription,
//     Amount,
//     TransactionNumber,
//   } = body;

//   try {
//     // Validate required fields
//     if (
//       !ReferenceUserId ||
//       !TransactionNumber ||
//       typeof Status === "undefined"
//     ) {
//       return NextResponse.json(
//         { error: "Missing required fields" },
//         { status: 400 },
//       );
//     }

//     // Map DPay status
//     let txnStatus = "PENDING";
//     if (Status === 3) txnStatus = "COMPLETED";
//     else if (Status === 4) txnStatus = "REJECTED";

//     // Update DPay status & webhook
//     await prisma.dpayTransaction.updateMany({
//       where: { transactionNumber: TransactionNumber },
//       data: {
//         status: txnStatus,
//         rawWebhook: body,
//         ...(Status === 4 ? { qbetStatus: "REJECTED" } : {}),
//       },
//     });

//     // ----------------------------
//     // Atomic check & lock for QBet deposit
//     // ----------------------------
//     const lockedTxn = await prisma.dpayTransaction.updateMany({
//       where: {
//         transactionNumber: TransactionNumber,
//         qbetStatus: "PENDING",
//         status: "COMPLETED",
//       },
//       data: { qbetStatus: "PROCESSING" }, // temporary status to prevent duplicates
//     });

//     if (Status === 3 && lockedTxn.count === 1) {
//       // Safe to call QBet deposit
//       const transactionRes = await createTransaction({
//         id: ReferenceUserId,
//         txn: TransactionNumber,
//         type: "DEPOSIT",
//         amount: Number(Amount),
//       });

//       const success =
//         transactionRes?.ok &&
//         Array.isArray(transactionRes.data?.data) &&
//         transactionRes.data.data[0]?.code === 0;

//       if (success) {
//         const balanceAfter = transactionRes.data.data[0]?.balance_after;
//         console.log(
//           `[CASHIN SUCCESS] User: ${ReferenceUserId} Amount: ${Amount} Tx: ${TransactionNumber} NewBalance: ${balanceAfter}`,
//         );

//         await prisma.dpayTransaction.updateMany({
//           where: { transactionNumber: TransactionNumber },
//           data: { qbetStatus: "LOADED" },
//         });
//       } else {
//         console.error(
//           `[CASHIN ERROR] Failed to credit balance for User: ${ReferenceUserId} Tx: ${TransactionNumber}. Response:`,
//           JSON.stringify(transactionRes),
//         );

//         await prisma.dpayTransaction.updateMany({
//           where: { transactionNumber: TransactionNumber },
//           data: { qbetStatus: "FAILED" },
//         });

//         return NextResponse.json(
//           { error: "Failed to record transaction", transactionRes },
//           { status: 500 },
//         );
//       }
//     } else if (Status === 3 && lockedTxn.count === 0) {
//       // QBet deposit already processed
//       console.log(
//         `[SKIP QBET DEPOSIT] Tx: ${TransactionNumber} qbetStatus already processed.`,
//       );
//     } else if (Status === 4) {
//       console.log(
//         `[CASHIN FAILED] User: ${ReferenceUserId} Tx: ${TransactionNumber} Reason: ${StatusDescription}`,
//       );
//     } else {
//       console.log(
//         `[CASHIN UPDATE] User: ${ReferenceUserId} Tx: ${TransactionNumber} Status: ${StatusDescription}`,
//       );
//     }

//     return NextResponse.json({ ok: true });
//   } catch (err: any) {
//     console.error("PAYMENT CALLBACK ERROR", err);
//     return NextResponse.json(
//       { error: "Failed to process callback" },
//       { status: 500 },
//     );
//   }
// }

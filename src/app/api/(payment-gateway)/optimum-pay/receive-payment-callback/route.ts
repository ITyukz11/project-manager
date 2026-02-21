import { prisma } from "@/lib/prisma";
import { createTransaction } from "@/lib/qbet88/createTransaction";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const raw = await req.text();
    const params = new URLSearchParams(raw);

    const merchantOrderNo = params.get("merchant_order_no");
    const amount = params.get("amount");
    const status = params.get("status"); // 1 success / 0 failed
    const errorCode = params.get("error_code");
    const transId = params.get("trans_id");
    const sign = params.get("sign");
    const depositTime = params.get("deposit_time");
    const processTime = params.get("process_time");

    if (!merchantOrderNo || status === null) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // 🔎 Find transaction
    const txn = await prisma.optimumPayTransaction.findUnique({
      where: { id: merchantOrderNo },
    });

    if (!txn) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 },
      );
    }

    const txnStatus = status === "1" ? "COMPLETED" : "FAILED";

    // ⏱ Convert gateway time → JS Date
    const toDate = (val: string | null) =>
      val ? new Date(val.replace(" ", "T")) : null;

    // 🧾 ALWAYS store webhook
    await prisma.optimumPayTransaction.update({
      where: { id: merchantOrderNo },
      data: {
        status: txnStatus,
        gatewayStatus: Number(status),
        error_code: errorCode,
        sign,
        trans_id: transId,
        rawWebhook: Object.fromEntries(params),

        deposit_time: toDate(depositTime),
        process_time: toDate(processTime),

        dPayCompletedAt: status === "1" ? new Date() : null,

        ...(status === "0" ? { qbetStatus: "REJECTED" } : {}),
      },
    });

    // ❌ STOP if failed
    if (status === "0") {
      console.log(
        `[CASHIN FAILED] Tx: ${merchantOrderNo} Reason: ${errorCode}`,
      );
      return NextResponse.json({ ok: true });
    }

    // 🧠 ATOMIC LOCK → prevent double credit
    const lock = await prisma.optimumPayTransaction.updateMany({
      where: {
        id: merchantOrderNo,
        status: "COMPLETED",
        qbetStatus: "PENDING",
      },
      data: { qbetStatus: "PROCESSING" },
    });

    if (lock.count === 0) {
      console.log(`[SKIP] Already processed → ${merchantOrderNo}`);
      return NextResponse.json({ ok: true });
    }

    // 💰 CREDIT QBET
    const qbetRes = await createTransaction({
      id: txn.userId,
      txn: merchantOrderNo,
      type: "DEPOSIT",
      amount: Number(amount),
    });

    const success =
      qbetRes?.ok &&
      Array.isArray(qbetRes.data?.data) &&
      qbetRes.data.data[0]?.code === 0;

    if (success) {
      await prisma.optimumPayTransaction.update({
        where: { id: merchantOrderNo },
        data: {
          qbetStatus: "LOADED",
          qbetDepositedAt: new Date(),
        },
      });

      console.log(
        `[CASHIN SUCCESS] User: ${txn.userId} Amount: ${amount} Tx: ${merchantOrderNo}`,
      );
    } else {
      await prisma.optimumPayTransaction.update({
        where: { id: merchantOrderNo },
        data: {
          qbetStatus: "FAILED",
        },
      });

      console.error("[QBET ERROR]", qbetRes);

      return NextResponse.json(
        { error: "Failed to credit QBET" },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("PAYMENT CALLBACK ERROR", err);
    return NextResponse.json(
      { error: "Callback processing failed" },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import md5 from "crypto-js/md5";

const API_URL = process.env.QBET88_API_URL_TRANSACTION!;
const OP_CODE = process.env.QBET88_OP_CODE!;
const SECRET_KEY = process.env.QBET88_API_KEY!;

function getManilaUnixTimestamp() {
  const now = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" })
  );
  return Math.floor(now.getTime() / 1000).toString();
}

export async function POST(req: NextRequest) {
  try {
    const { id, txn, type, amount } = await req.json();

    // 🔒 Basic validation
    if (
      !id ||
      !txn ||
      !type ||
      !amount ||
      !["DEPOSIT", "WITHDRAW"].includes(type.toUpperCase())
    ) {
      return NextResponse.json(
        { error: "Invalid or missing parameters" },
        { status: 400 }
      );
    }

    const request_time = getManilaUnixTimestamp();

    const sign = md5(
      OP_CODE + request_time + "gateway" + SECRET_KEY
    ).toString();

    const body = {
      batch_requests: [
        {
          id,
          type: type.toUpperCase(), // DEPOSIT | WITHDRAW
          amount: amount.toString(), // must be string
          txn,
        },
      ],
      op_code: OP_CODE,
      request_time,
      sign,
    };

    console.log("Submitting transaction:", body);

    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    return NextResponse.json(data, { status: res.ok ? 200 : 502 });
  } catch (error) {
    console.error("Transaction API error:", error);
    return NextResponse.json(
      {
        error: "Transaction failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

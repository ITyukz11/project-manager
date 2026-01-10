import { NextRequest, NextResponse } from "next/server";
import md5 from "crypto-js/md5";

const API_URL_BALANCE = process.env.QBET88_API_URL_BALANCE!;
const OP_CODE = process.env.QBET88_OP_CODE;
const SECRET_KEY = process.env.QBET88_API_KEY;
function getManilaUnixTimestamp() {
  // Get current date/time in Asia/Manila timezone
  const now = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" })
  );
  // Convert to UNIX timestamp (seconds)
  return Math.floor(now.getTime() / 1000).toString();
}
export async function POST(req: NextRequest) {
  const { member_account } = await req.json();

  if (!member_account) {
    return NextResponse.json(
      { error: "Missing member_account" },
      { status: 400 }
    );
  }

  const request_time = getManilaUnixTimestamp();
  const sign = md5(
    OP_CODE + request_time + "getbalance" + SECRET_KEY
  ).toString();

  const body = {
    batch_requests: [{ member_account }],
    op_code: OP_CODE,
    request_time,
    sign,
  };

  console.log("Balance fetch request body:", JSON.stringify(body));
  try {
    const apiRes = await fetch(API_URL_BALANCE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!apiRes.ok) {
      return NextResponse.json(
        { error: "Remote API error", status: apiRes.status },
        { status: 502 }
      );
    }

    const data = await apiRes.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error("Balance fetch error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch balance",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

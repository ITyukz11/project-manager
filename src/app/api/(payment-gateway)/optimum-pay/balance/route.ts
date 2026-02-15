import { NextRequest, NextResponse } from "next/server";

const PROXY_BASE_URL = process.env.PROXY_OPTIMUMPAY_BASE_URL;

export async function POST(req: NextRequest) {
  try {
    console.log("📥 Balance check request received");

    // generate a unique reference for the gateway
    const merchant_order_no = `BAL_${Date.now()}`;

    const response = await fetch(`${PROXY_BASE_URL}/api/balance-optimum-pay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ merchant_order_no }),
    });

    const text = await response.text();

    console.log("📥 Balance response:", text);

    return new NextResponse(text, { status: response.status });
  } catch (err) {
    console.error("❌ Balance proxy error:", err);

    return NextResponse.json(
      { error: "Failed to fetch balance" },
      { status: 500 },
    );
  }
}

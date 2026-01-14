import { NextResponse } from "next/server";

export async function POST() {
  try {
    const res = await fetch(
      //167.99.31.96 MAIN STATIC
      //167.99.31.96 DEV STATIC IPv4
      "http://167.99.31.96:3001/receive-payment-request",
      //   "http://167.99.31.96:3001/api/payment-callback",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: 100, userId: "demoUser" }),
      }
    );

    return NextResponse.json({
      message: "Payment request sent",
      data: await res.json(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { message: "Error sending payment request", error: error.message },
      { status: 500 }
    );
  }
}

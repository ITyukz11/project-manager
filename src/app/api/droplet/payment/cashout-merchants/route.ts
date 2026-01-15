// src/app/api/droplet/payment/cashout-merchants/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch(
      `${process.env.PROXY_BASE_URL}/api/cashout-merchants`
    );
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch cashout merchants" },
      { status: 500 }
    );
  }
}

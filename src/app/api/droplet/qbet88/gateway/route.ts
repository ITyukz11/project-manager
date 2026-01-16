// app/api/droplet/qbet88/transaction/route.ts
import { NextRequest, NextResponse } from "next/server";

const PROXY_URL = process.env.QBET88_PROXY_URL!;
// Example: http://YOUR_DROPLET_IP:4000/api/qbet88/transaction

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    console.log("body:", body);
    // Basic validation
    if (!body.batch_requests) {
      return NextResponse.json(
        { error: "Missing parameters: id, txn, type, or amount" },
        { status: 400 }
      );
    }

    if (
      !["DEPOSIT", "WITHDRAW"].includes(
        body.batch_requests[0].type.toUpperCase()
      )
    ) {
      return NextResponse.json(
        { error: "Invalid type. Must be DEPOSIT or WITHDRAW" },
        { status: 400 }
      );
    }

    // Call your Droplet proxy
    const proxyRes = await fetch(`${PROXY_URL}/api/qbet88/gateway`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const text = await proxyRes.text();

    // Try parsing JSON, handle invalid responses
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON from proxy", raw: text },
        { status: 502 }
      );
    }

    return NextResponse.json(data, { status: proxyRes.ok ? 200 : 502 });
  } catch (err: unknown) {
    console.error("Next.js transaction API error:", err);
    return NextResponse.json(
      {
        error: "Failed to reach proxy",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}

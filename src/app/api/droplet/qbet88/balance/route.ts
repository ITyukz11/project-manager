import { NextRequest, NextResponse } from "next/server";

const PROXY_URL = process.env.QBET88_PROXY_URL!;
// example: http://YOUR_DROPLET_IP:4000/api/qbet88/balance

export async function POST(req: NextRequest) {
  try {
    const { member_account } = await req.json();

    if (!member_account) {
      return NextResponse.json(
        { error: "Missing member_account" },
        { status: 400 }
      );
    }

    // Call your Droplet proxy
    const proxyRes = await fetch(`${PROXY_URL}/api/qbet88/balance`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ member_account }),
    });

    if (!proxyRes.ok) {
      const text = await proxyRes.text();
      console.error("Proxy error:", text);
      return NextResponse.json(
        { error: "Proxy error", status: proxyRes.status },
        { status: 502 }
      );
    }

    const data = await proxyRes.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error("Next.js API error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch balance",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

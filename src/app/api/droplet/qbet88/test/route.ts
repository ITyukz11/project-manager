import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const proxyRes = await fetch(
      `${process.env.QBET88_PROXY_URL}/api/qbet88/test`,
      {
        method: "GET", // still call proxy test route with GET
        headers: {
          "x-proxy-key": process.env.PROXY_SECRET || "",
        },
      }
    );

    const text = await proxyRes.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON from proxy", raw: text },
        { status: 502 }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to reach proxy", details: (err as Error).message },
      { status: 500 }
    );
  }
}

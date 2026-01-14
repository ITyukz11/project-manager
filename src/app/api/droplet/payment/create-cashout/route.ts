import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const resp = await fetch(`${process.env.DROPLET_BASE}/api/create-cashout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await resp.json();
    return NextResponse.json(data, { status: resp.status });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || String(err) },
      { status: 500 }
    );
  }
}

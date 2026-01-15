import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const transactionNumber = searchParams.get("transactionNumber");
  if (!transactionNumber)
    return NextResponse.json(
      { error: "transactionNumber is required" },
      { status: 400 }
    );

  try {
    const resp = await fetch(
      `${
        process.env.PROXY_BASE_URL
      }/api/cashout-transaction/${encodeURIComponent(transactionNumber)}`
    );
    const data = await resp.json();
    return NextResponse.json(data, { status: resp.status });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || String(err) },
      { status: 500 }
    );
  }
}

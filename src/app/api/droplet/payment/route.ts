import { NextRequest, NextResponse } from "next/server";

// Base URL of your DigitalOcean proxy
const PROXY_BASE_URL = process.env.PROXY_BASE_URL;

// ------------------------
// GET Endpoints
// ------------------------
export async function GET(request: NextRequest) {
  const { searchParams, pathname } = new URL(request.url);

  try {
    let targetUrl = "";

    // Map pathnames to your proxy endpoints
    if (pathname.endsWith("/banks")) {
      targetUrl = `${PROXY_BASE_URL}/api/banks`;
    } else if (pathname.endsWith("/cashin-merchants")) {
      targetUrl = `${PROXY_BASE_URL}/api/cashin-merchants`;
    } else if (pathname.endsWith("/cashout-merchants")) {
      targetUrl = `${PROXY_BASE_URL}/api/cashout-merchants`;
    } else if (pathname.endsWith("/cashin-transaction")) {
      const tx = searchParams.get("transactionNumber");
      if (!tx)
        return NextResponse.json(
          { error: "Missing transactionNumber" },
          { status: 400 }
        );
      targetUrl = `${PROXY_BASE_URL}/api/cashin-transaction/${tx}`;
    } else if (pathname.endsWith("/cashout-transaction")) {
      const tx = searchParams.get("transactionNumber");
      if (!tx)
        return NextResponse.json(
          { error: "Missing transactionNumber" },
          { status: 400 }
        );
      targetUrl = `${PROXY_BASE_URL}/api/cashout-transaction/${tx}`;
    } else {
      return NextResponse.json(
        { error: "Invalid GET endpoint" },
        { status: 404 }
      );
    }

    const response = await fetch(targetUrl);
    const data = await response.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch data from proxy" },
      { status: 500 }
    );
  }
}

// ------------------------
// POST Endpoints
// ------------------------
export async function POST(request: NextRequest) {
  const { pathname } = new URL(request.url);

  try {
    const body = await request.json();
    let targetUrl = "";

    if (pathname.endsWith("/create-cashin")) {
      targetUrl = `${PROXY_BASE_URL}/api/create-cashin`;
    } else if (pathname.endsWith("/create-cashout")) {
      targetUrl = `${PROXY_BASE_URL}/api/create-cashout`;
    } else if (pathname.endsWith("/payment-callback")) {
      targetUrl = `${PROXY_BASE_URL}/api/payment-callback`;
    } else if (pathname.endsWith("/receive-payment-request")) {
      targetUrl = `${PROXY_BASE_URL}/receive-payment-request`;
    } else {
      return NextResponse.json(
        { error: "Invalid POST endpoint" },
        { status: 404 }
      );
    }

    const response = await fetch(targetUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to call proxy" },
      { status: 500 }
    );
  }
}

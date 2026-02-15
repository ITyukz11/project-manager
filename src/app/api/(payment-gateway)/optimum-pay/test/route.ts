// app/api/proxy-test/route.ts
import { NextResponse } from "next/server";

const PROXY_BASE_URL = process.env.PROXY_OPTIMUMPAY_BASE_URL;

// GET route for test connection
export async function GET() {
  console.log("PROXY_BASE_URL:", PROXY_BASE_URL);

  try {
    const response = await fetch(`${PROXY_BASE_URL}/api/test-connection`);
    const data = await response.json();
    return NextResponse.json(data);
  } catch (err: any) {
    console.error("Error calling test connection:", err);
    return NextResponse.json(
      { error: "Failed to call test connection" },
      { status: 500 },
    );
  }
}

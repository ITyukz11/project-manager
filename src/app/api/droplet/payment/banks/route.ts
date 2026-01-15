import { NextResponse } from "next/server";

// Use HTTPS if your droplet supports it

export async function GET() {
  try {
    const res = await fetch(`${process.env.PROXY_BASE_URL}/api/banks`, {
      // Example if you want to send a custom API key for security
      // headers: {
      //   "Authorization": `Bearer ${process.env.DROPLET_API_KEY}`,
      // }
    });
    if (!res.ok) {
      // Bubble up droplet errors for better debugging
      return NextResponse.json(
        { error: "Droplet responded with error", statusCode: res.status },
        { status: res.status }
      );
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch banks", details: err.message },
      { status: 500 }
    );
  }
}

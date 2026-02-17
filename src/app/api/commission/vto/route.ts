// app/api/proxy/vto/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const userId = url.searchParams.get("userId");
  const unclaimed = url.searchParams.get("unclaimed");

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  const externalUrl = `https://qbet88.xyz/api/users/${userId}/vto${unclaimed ? `?unclaimed=${unclaimed}` : ""}`;

  try {
    const res = await fetch(externalUrl);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("Proxy fetch failed:", err);
    return NextResponse.json(
      { error: "Failed to fetch from external API" },
      { status: 500 },
    );
  }
}

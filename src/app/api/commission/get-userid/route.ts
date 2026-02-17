// app/api/proxy/get-userid/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const userName = url.searchParams.get("userName");
  if (!userName)
    return NextResponse.json({ error: "Missing userName" }, { status: 400 });

  const res = await fetch(
    `https://qbet88.xyz/api/users/get-userid?userName=${userName}`,
  );
  const data = await res.json();

  return NextResponse.json(data);
}

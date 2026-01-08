// api/gateway-alarm-stop/route.ts
import { pusher } from "@/lib/pusher";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { name, casinoGroup } = await req.json(); // GET casinoGroup sent by the client!
  if (!name || !casinoGroup) {
    return NextResponse.json(
      { error: "Missing name or casinoGroup" },
      { status: 422 }
    );
  }
  await pusher.trigger("gateway-alarm", "gateway-alarm-stopped", {
    name,
    casinoGroup,
  });
  return NextResponse.json({ success: true });
}

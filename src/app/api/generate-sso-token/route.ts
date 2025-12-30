import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // Use your actual NextAuth config location

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const adminId = searchParams.get("adminId");

  const session = await getServerSession(authOptions);

  if (!session || !session.user?.username || !adminId) {
    return NextResponse.json(
      { error: "Unauthorized or missing fields" },
      { status: 401 }
    );
  }

  const payload = {
    userName: session.user.username,
    adminId: adminId,
    iss: "partner",
    aud: "nxtlotto",
    exp: Math.floor(Date.now() / 1000) + 120, // Expires in 2 minutes
  };

  const secret = process.env.JWT_NXTLOTTO_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Missing JWT secret on partner site" },
      { status: 500 }
    );
  }

  const token = jwt.sign(payload, secret);

  return NextResponse.json({ token });
}

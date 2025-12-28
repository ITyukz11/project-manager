import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const jwtSecret = process.env.JWT_NXTLOTTO_SECRET!;

export async function GET(req: NextRequest) {
  // Example: ?adminId=xyz
  const adminId = req.nextUrl.searchParams.get("adminId")!;
  const token = jwt.sign({ adminId }, jwtSecret, { expiresIn: "3m" });
  return NextResponse.json({ token });
}

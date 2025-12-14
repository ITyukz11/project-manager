import { NextResponse } from "next/server";
import * as bcrypt from "bcrypt";
import { z } from "zod";

/**
 * IMPORTANT:
 * - This file expects a Prisma client instance exported from '@/lib/prisma'.
 *   If your project uses a different path for the Prisma client, update the import below.
 * - Install dependencies if not already installed:
 *   npm install bcryptjs zod
 */

import prisma from "@/lib/prisma"; // adjust this path if your Prisma client is elsewhere

const bodySchema = z.object({
  password: z.string().min(1, "Password must be at least 1 character"),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // validate params
    const id = (await params).id;

    // parse and validate body
    const json = await req.json().catch(() => ({}));
    const parsedBody = bodySchema.safeParse(json);
    if (!parsedBody.success) {
      return NextResponse.json(
        { message: parsedBody.error[0].message },
        { status: 400 }
      );
    }
    const { password } = parsedBody.data;

    // hash the password
    const hashed = await bcrypt.hash(password, 10);

    // update user password in the database
    await prisma.user.update({
      where: { id },
      data: { password: hashed },
    });

    return NextResponse.json({ message: "Password updated" }, { status: 200 });
  } catch (err: any) {
    // Prisma "record not found" error code
    if (err?.code === "P2025") {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }
    console.error("Error updating password:", err);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

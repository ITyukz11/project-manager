import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import z from "zod";
import * as bcrypt from "bcrypt";
import { ADMINROLES } from "@/lib/types/role";

// Convert ADMINROLES to an array of values
const adminRolesArray = Object.values(ADMINROLES);

const UserSchema = z.object({
  name: z.string().min(1),
  username: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(1),
  messengerLink: z.string().min(1),
  role: z.enum(adminRolesArray as [string, ...string[]]), // Only ADMINROLES allowed!
});

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const parsed = UserSchema.parse(data);
    // Always hash passwords!
    const hashedPassword = await bcrypt.hash(parsed.password, 10);

    const user = await prisma.user.create({
      data: {
        name: parsed.name,
        username: parsed.username,
        email: parsed.email,
        password: hashedPassword,
        messengerLink: parsed.messengerLink,
        role: ADMINROLES[parsed.role as keyof typeof ADMINROLES],
      },
    });

    // Don't return sensitive fields
    return NextResponse.json(
      { user: { ...user, password: undefined } },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Something went wrong" },
      { status: 400 }
    );
  }
}

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      where: {
        role: { in: adminRolesArray },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

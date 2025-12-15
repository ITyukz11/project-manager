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
  messengerLink: z.string().optional(),
  casinoGroups: z.array(z.string()).optional(), // <-- support an array
  role: z.enum(adminRolesArray as [string, ...string[]]), // Only ADMINROLES allowed!
});

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const parsed = UserSchema.parse(data);

    // Always hash passwords!
    const hashedPassword = await bcrypt.hash(parsed.password, 10);

    // Find all casino groups from provided array (by name or id, here using id)
    let connectCasinoGroups: { id: string }[] = [];

    if (!parsed.casinoGroups) {
      return NextResponse.json(
        { error: "At least one casino group must be selected" },
        { status: 400 }
      );
    }
    if (
      parsed.casinoGroups &&
      Array.isArray(parsed.casinoGroups) &&
      parsed.casinoGroups.length > 0
    ) {
      // Find all by ID, or change this to find by name if needed
      const groups = await prisma.casinoGroup.findMany({
        where: {
          id: { in: parsed.casinoGroups },
        },
      });
      if (groups.length !== parsed.casinoGroups.length) {
        throw new Error("One or more casino groups not found");
      }
      connectCasinoGroups = groups.map((g) => ({ id: g.id }));
    }

    const user = await prisma.user.create({
      data: {
        name: parsed.name,
        username: parsed.username,
        email: parsed.email,
        password: hashedPassword,
        messengerLink: parsed.messengerLink,
        casinoGroups: connectCasinoGroups.length
          ? {
              connect: connectCasinoGroups,
            }
          : undefined,
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

// This GET is for `api/users?casinoGroupId=...`
export async function GET(req: Request) {
  // Get casinoGroup from URL search params
  const url = new URL(req.url);
  const casinoGroup = url.searchParams.get("casinoGroup");

  // Build base where clause for admin roles
  const whereClause: any = {
    role: { in: adminRolesArray },
  };

  // If casinoGroup is provided, add filter
  if (casinoGroup) {
    whereClause.casinoGroups = {
      some: {
        name: { equals: casinoGroup, mode: "insensitive" },
      },
    };
  }

  try {
    const users = await prisma.user.findMany({
      where: whereClause,
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

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = (await params).id;
  if (!userId) {
    return NextResponse.json({ error: "Missing user ID." }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        casinoGroups: {
          select: { id: true, name: true },
        },
        attendances: true,
      },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    return NextResponse.json(user, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch casino groups." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = (await params).id;
  if (!userId) {
    return NextResponse.json({ error: "Missing user ID." }, { status: 400 });
  }

  let data;
  try {
    data = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  // Extract only updatable user fields and relationships
  const {
    name,
    username,
    email,
    messengerLink,
    role,
    casinoGroupId, // array of IDs
    password,
    // ...add any other possible updatable fields (but not password here!)
  } = data;

  let hashedPassword;
  if (password && password.length > 0) {
    // Only hash if password is supplied and non-empty
    hashedPassword = await bcrypt.hash(password, 10);
  }

  // You can add field checks here as desired
  try {
    // Prisma update
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        username,
        email,
        messengerLink,
        role,
        ...(hashedPassword ? { password: hashedPassword } : {}),
        ...(Array.isArray(casinoGroupId)
          ? {
              casinoGroups: {
                set: casinoGroupId.map((id: string) => ({ id })),
              },
            }
          : {}),
      },
      include: {
        casinoGroups: {
          select: { id: true, name: true },
        },
        attendances: true,
      },
    });

    return NextResponse.json(updatedUser, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to update user." },
      { status: 500 }
    );
  }
}

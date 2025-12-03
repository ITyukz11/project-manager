import { authOptions, getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import z from "zod";
import { Prisma } from "@prisma/client"; // Make sure to import Prisma

const CasinoGroupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  users: z.array(z.string()).optional(), // array of user IDs
});

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (
    !session?.user ||
    !session.user.role ||
    (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const url = new URL(req.url);
    const casinoId = url.searchParams.get("casinoId");

    const result = await prisma.$transaction(async (tx) => {
      const superAdminId = await tx.superAdmin.findUnique({
        where: { ownerId: session.user.id },
      });

      if (!superAdminId) {
        return NextResponse.json(
          { error: "SuperAdmin or Admin not found or not authorized." },
          { status: 403 }
        );
      }

      if (casinoId) {
        // Get one casino group by id
        const group = await tx.casinoGroup.findUnique({
          where: { id: casinoId, superAdminId: superAdminId.id },
          include: {
            users: true,
            groupChats: true,
          },
        });
        if (!group)
          return NextResponse.json(
            { error: "Casino group not found." },
            { status: 404 }
          );
        return [group]; // always return array for SWR shape
      } else {
        // Get all casino groups by superAdmin
        const groups = await tx.casinoGroup.findMany({
          where: {
            superAdminId: superAdminId.id,
          },
          include: {
            _count: {
              select: { users: true, groupChats: true },
            },
          },
          orderBy: { createdAt: "desc" },
        });
        return groups;
      }
    });

    if (result instanceof NextResponse) {
      return result;
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Error fetching casino group(s):", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const values = CasinoGroupSchema.parse(body);

    // Extract users from payload for connect
    const userIds = Array.isArray(values.users) ? values.users : [];

    const result = await prisma.$transaction(async (tx) => {
      const superAdminId = await tx.superAdmin.findUnique({
        where: { ownerId: currentUser.id },
      });

      // ERROR RETURN: superAdminId not found!
      if (!superAdminId) {
        return NextResponse.json(
          { error: "SuperAdmin not found or not authorized." },
          { status: 403 }
        );
      }

      userIds.push(superAdminId.ownerId); // Ensure superadmin is included
      const uniqueUserIds = Array.from(new Set(userIds)); // Remove duplicates
      // Create group and connect users if provided
      const group = await tx.casinoGroup.create({
        data: {
          name: values.name,
          description: values.description,
          superAdminId: superAdminId.id,
          users: uniqueUserIds.length
            ? { connect: uniqueUserIds.map((id: string) => ({ id })) }
            : undefined,
        },
      });
      return group;
    });

    // If result is a NextResponse error, return it directly
    if (result instanceof NextResponse) {
      return result;
    }

    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    // Prisma error for unique constraint violation
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (
        err.code === "P2002" &&
        Array.isArray(err.meta?.target) &&
        err.meta.target.includes("name")
      ) {
        return NextResponse.json(
          {
            error:
              "Casino group name already exists. Please choose another name.",
          },
          { status: 400 }
        );
      }
      // Add handling for other Prisma errors if desired
    }

    // Zod validation error
    if (err.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid input. Please check your form fields." },
        { status: 400 }
      );
    }

    // Fallback
    return NextResponse.json(
      { error: err.message || "Failed to create casino group." },
      { status: 400 }
    );
  }
}

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { Prisma } from "@prisma/client";
import z from "zod";

export const CasinoGroupFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  users: z.array(z.string()).optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const casinoId = (await params).id;

  const currentUser = await getCurrentUser();
  if (
    !currentUser ||
    !currentUser.role ||
    (currentUser.role !== "ADMIN" && currentUser.role !== "SUPERADMIN")
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  if (!casinoId) {
    return NextResponse.json(
      { error: "Missing casino group ID." },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();
    const values = CasinoGroupFormSchema.parse(body);

    // Extract users array if provided
    const userIds = Array.isArray(values.users) ? values.users : [];

    // Only allow updating groups from this superAdmin
    const group = await prisma.casinoGroup.findUnique({
      where: { id: casinoId },
    });

    if (!group) {
      return NextResponse.json(
        { error: "Casino group not found." },
        { status: 404 }
      );
    }

    //only superadmin and admin can update
    if (currentUser.role !== "SUPERADMIN" && currentUser.role !== "ADMIN") {
      return NextResponse.json(
        {
          error:
            "Forbidden: You don't have the permission to update this group.",
        },
        { status: 403 }
      );
    }

    // Perform PATCH update
    // For users: replace with set of new userIds (not connect, but set)
    const updated = await prisma.casinoGroup.update({
      where: { id: casinoId },
      data: {
        name: values.name,
        description: values.description,
        users: {
          set: userIds.map((id: string) => ({ id })),
        },
      },
      include: {
        users: true,
        groupChats: true,
      },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (err: any) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2002") {
        return NextResponse.json(
          {
            error:
              "Casino group name already exists. Please choose another name.",
          },
          { status: 400 }
        );
      }
    }
    if (err.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid input. Please check your form fields." },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: err.message || "Failed to update casino group." },
      { status: 400 }
    );
  }
}

// DELETE casino group by id, also removes user relationships and groupChats.
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const currentUser = await getCurrentUser();

  if (
    !currentUser ||
    !currentUser.role ||
    (currentUser.role !== "ADMIN" && currentUser.role !== "SUPERADMIN")
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const casinoId = (await params).id;
  if (!casinoId) {
    return NextResponse.json(
      { error: "Missing casino group ID." },
      { status: 400 }
    );
  }

  try {
    // Find group to verify existence and ownership
    const group = await prisma.casinoGroup.findUnique({
      where: { id: casinoId },
      include: {
        users: true,
        groupChats: true,
      },
    });

    if (!group) {
      return NextResponse.json(
        { error: "Casino group not found." },
        { status: 404 }
      );
    }

    // Optional: Check authorization for SUPERADMIN
    if (currentUser.role !== "SUPERADMIN" && currentUser.role !== "ADMIN") {
      return NextResponse.json(
        {
          error:
            "Forbidden: You don't have the permission to delete this group.",
        },
        { status: 403 }
      );
    }

    // Remove user relationships first if needed
    // This depends on your Prisma schema -- if relations are "onDelete: Cascade", this is automatic!
    // If not, you may need to disconnect users manually for safety.
    await prisma.casinoGroup.update({
      where: { id: casinoId },
      data: {
        users: { set: [] }, // Remove all user associations
      },
    });

    // Delete related groupChats if needed. If cascading is not set in Prisma, do it manually.
    await prisma.groupChat.deleteMany({
      where: { casinoGroupId: casinoId },
    });

    // Now, delete the group itself
    await prisma.casinoGroup.delete({
      where: { id: casinoId },
    });

    return NextResponse.json(
      { message: "Casino group deleted." },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to delete casino group." },
      { status: 500 }
    );
  }
}

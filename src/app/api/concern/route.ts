import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { ADMINROLES, NETWORKROLES } from "@/lib/types/role";
import { pusher } from "@/lib/pusher";

const STATUS_SORT = {
  PENDING: 1,
  COMPLETED: 2,
  REJECTED: 3,
};

// ---------------------------------------------------
// GET: Fetch concerns (casino-group scoped)
// ---------------------------------------------------
export async function GET(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const casinoGroup = url.searchParams.get("casinoGroup");

    const allowedRoles = [
      ...Object.values(ADMINROLES),
      ...Object.values(NETWORKROLES),
    ];

    const concerns = await prisma.concern.findMany({
      where: {
        ...(casinoGroup && {
          casinoGroup: {
            name: { equals: casinoGroup, mode: "insensitive" },
          },
        }),
        user: {
          role: { in: allowedRoles },
          ...(casinoGroup && {
            casinoGroups: {
              some: {
                name: { equals: casinoGroup, mode: "insensitive" },
              },
            },
          }),
        },
      },
      include: {
        attachments: true,
        concernThreads: true,
        user: true,
      },
      orderBy: { createdAt: "desc" },
    });

    concerns.sort((a, b) => STATUS_SORT[a.status] - STATUS_SORT[b.status]);

    return NextResponse.json(concerns);
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// ---------------------------------------------------
// POST: Create concern (fully secured)
// ---------------------------------------------------
export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    const formData = await req.formData();

    const subject = formData.get("subject") as string;
    const details = formData.get("details") as string;
    const casinoGroupName = formData.get("casinoGroup") as string;
    const usersRaw = formData.get("users") as string;

    if (!subject?.trim()) {
      return NextResponse.json(
        { error: "Subject is required." },
        { status: 400 }
      );
    }

    if (!details?.trim()) {
      return NextResponse.json(
        { error: "Concern details are required." },
        { status: 400 }
      );
    }

    const casinoGroup = await prisma.casinoGroup.findFirst({
      where: {
        name: { equals: casinoGroupName, mode: "insensitive" },
      },
    });

    if (!casinoGroup) {
      return NextResponse.json(
        { error: "Invalid casino group specified." },
        { status: 400 }
      );
    }

    // ---------------------------------------------------
    // SECURITY: Creator must belong to casino group
    // ---------------------------------------------------
    const isMember = await prisma.user.findFirst({
      where: {
        id: currentUser.id,
        casinoGroups: {
          some: { id: casinoGroup.id },
        },
      },
    });

    if (!isMember) {
      return NextResponse.json(
        { error: "You are not a member of this casino group." },
        { status: 403 }
      );
    }

    // ---------------------------------------------------
    // Upload attachments
    // ---------------------------------------------------
    const attachments: File[] = formData.getAll("attachment") as File[];
    const attachmentData: {
      url: string;
      filename: string;
      mimetype: string;
    }[] = [];

    for (const file of attachments) {
      if (file && file.size > 0) {
        const blob = await put(file.name, file, {
          access: "public",
          addRandomSuffix: true,
        });

        attachmentData.push({
          url: blob.url,
          filename: file.name,
          mimetype: file.type || "",
        });
      }
    }

    // ---------------------------------------------------
    // SECURITY: Validate tagged users (same casino group)
    // ---------------------------------------------------
    const requestedUserIds: string[] = usersRaw ? JSON.parse(usersRaw) : [];

    const validTaggedUsers = await prisma.user.findMany({
      where: {
        id: { in: requestedUserIds },
        active: true,
        casinoGroups: {
          some: { id: casinoGroup.id },
        },
      },
      select: { id: true },
    });

    const taggedUserIds = validTaggedUsers.map((u) => u.id);

    // ---------------------------------------------------
    // Transaction
    // ---------------------------------------------------
    const result = await prisma.$transaction(async (prisma) => {
      const concern = await prisma.concern.create({
        data: {
          subject,
          details,
          casinoGroupId: casinoGroup.id,
          userId: currentUser.id,
          tagUsers: {
            connect: taggedUserIds.map((id) => ({ id })),
          },
          attachments: {
            createMany: {
              data: attachmentData,
            },
          },
        },
        include: { attachments: true },
      });

      await prisma.concernLogs.create({
        data: {
          concernId: concern.id,
          action: "PENDING",
          performedById: currentUser.id,
        },
      });

      const pendingCount = await prisma.concern.count({
        where: {
          status: "PENDING",
          casinoGroupId: casinoGroup.id,
        },
      });

      // Group-scoped realtime update
      await pusher.trigger(
        `concern-${casinoGroupName.toLowerCase()}`,
        "concern-pending-count",
        { count: pendingCount }
      );

      // Per-user notifications (SAFE)
      await Promise.all(
        taggedUserIds.map(async (userId) => {
          const notification = await prisma.notifications.create({
            data: {
              userId,
              message: `${currentUser.username} tagged you in the Concern "${concern.subject}" in ${casinoGroupName}.`,
              link: `/${casinoGroupName.toLowerCase()}/concerns/${concern.id}`,
              isRead: false,
              type: "concerns",
              actor: currentUser.username,
              subject: concern.subject,
              casinoGroup: casinoGroupName,
            },
          });

          await pusher.trigger(
            `user-notify-${userId}`,
            "notifications-event",
            notification
          );
        })
      );

      return concern;
    });

    return NextResponse.json({ success: true, result });
  } catch (e: any) {
    console.error("Unexpected error creating concern:", e);
    return NextResponse.json(
      { error: "Unexpected server error. Please try again later." },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { ADMINROLES, NETWORKROLES } from "@/lib/types/role";
import { pusher } from "@/lib/pusher";
import { emitRemittanceUpdated } from "@/actions/server/emitRemittanceUpdated";

const STATUS_SORT = {
  PENDING: 1,
  COMPLETED: 2,
  REJECTED: 3,
};

// ---------------------------------------------------
// GET: Fetch remittances (casino-group scoped)
// ---------------------------------------------------
export async function GET(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const casinoGroup = url.searchParams.get("casinoGroup");
    const fromParam = url.searchParams.get("from");
    const toParam = url.searchParams.get("to");

    // Convert fromParam and toParam to start/end of day if only date is given
    let fromDate: Date | undefined;
    let toDate: Date | undefined;

    if (fromParam) {
      const f = new Date(fromParam);
      fromDate = new Date(
        f.getFullYear(),
        f.getMonth(),
        f.getDate(),
        0,
        0,
        0,
        0
      );
    }

    if (toParam) {
      const t = new Date(toParam);
      toDate = new Date(
        t.getFullYear(),
        t.getMonth(),
        t.getDate(),
        23,
        59,
        59,
        999
      );
    }

    const allowedRoles = [
      ...Object.values(ADMINROLES),
      ...Object.values(NETWORKROLES),
    ];

    // Build new "where" clause with date range filter (same pattern as cashout)
    const whereClause: any = {
      OR: [
        { status: "PENDING" },
        {
          NOT: { status: { in: ["PENDING"] } },
          ...(fromDate || fromDate
            ? {
                createdAt: {
                  ...(fromDate && { gte: fromDate }),
                  ...(toDate && { lte: toDate }),
                },
              }
            : {}),
        },
      ],
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
      ...(casinoGroup && {
        casinoGroup: {
          name: { equals: casinoGroup, mode: "insensitive" },
        },
      }),
    };

    const remittances = await prisma.remittance.findMany({
      where: whereClause,
      include: {
        attachments: true,
        remittanceThreads: true,
        user: true,
      },
      orderBy: { createdAt: "desc" },
    });

    remittances.sort((a, b) => STATUS_SORT[a.status] - STATUS_SORT[b.status]);

    return NextResponse.json(remittances);
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// ---------------------------------------------------
// POST: Create remittance (fully secured)
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
      const remittance = await prisma.remittance.create({
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

      await prisma.remittanceLogs.create({
        data: {
          remittanceId: remittance.id,
          action: "PENDING",
          performedById: currentUser.id,
        },
      });

      const pendingCount = await prisma.remittance.count({
        where: {
          status: "PENDING",
          casinoGroupId: casinoGroup.id,
        },
      });

      // Group-scoped realtime update
      await pusher.trigger(
        `remittance-${casinoGroupName.toLowerCase()}`,
        "remittance-pending-count",
        { count: pendingCount }
      );

      // Per-user notifications (SAFE)
      await Promise.all(
        taggedUserIds.map(async (userId) => {
          const notification = await prisma.notifications.create({
            data: {
              userId,
              message: `${currentUser.username} initiated a Remittance: "${remittance.subject}" in ${casinoGroupName}.`,
              link: `/${casinoGroupName.toLowerCase()}/remittance/${
                remittance.id
              }`,
              isRead: false,
              type: "remittance",
              actor: currentUser.username,
              subject: remittance.subject,
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

      await emitRemittanceUpdated({
        transactionId: remittance.id,
        casinoGroup: casinoGroupName,
        action: "CREATED",
      });

      return remittance;
    });

    return NextResponse.json({ success: true, result });
  } catch (e: any) {
    console.error("Unexpected error creating remittance:", e);
    return NextResponse.json(
      { error: "Unexpected server error. Please try again later." },
      { status: 500 }
    );
  }
}

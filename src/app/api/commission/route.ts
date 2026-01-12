import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { ADMINROLES, NETWORKROLES } from "@/lib/types/role";
import { pusher } from "@/lib/pusher";
import { emitCommissionUpdated } from "@/actions/server/emitCommissionUpdated";

// --- GET handler to fetch all commissions with attachments and threads ---
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

    // Build where clause
    const whereClause: any = {
      OR: [
        { status: "PENDING" },
        { status: "PARTIAL" }, // always include PENDING and PARTIAL
        {
          // other statuses with date range filter
          NOT: { status: { in: ["PENDING", "PARTIAL"] } },
          ...(fromDate || toDate
            ? {
                createdAt: {
                  ...(fromDate && { gte: fromDate }),
                  ...(toDate && { lte: toDate }),
                },
              }
            : {}),
        },
      ],
    };

    // Casino group filter (applies to all)
    if (casinoGroup) {
      whereClause.AND = [
        {
          casinoGroup: { name: { equals: casinoGroup, mode: "insensitive" } },
        },
      ];
    }

    // Allowed roles filter
    const allowedRoles = [
      ...Object.values(ADMINROLES),
      ...Object.values(NETWORKROLES),
    ];

    const commissions = await prisma.commission.findMany({
      where: whereClause,
      include: {
        attachments: true,
        _count: {
          select: {
            commissionThreads: true,
          },
        },
        user: {
          where: { role: { in: allowedRoles } },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Business sorting: pending, partial, rest sorted by createdAt desc
    const pending = commissions.filter((x) => x.status === "PENDING");
    const partial = commissions.filter((x) => x.status === "PARTIAL");
    const rest = commissions.filter(
      (x) => x.status !== "PENDING" && x.status !== "PARTIAL"
    );
    const sorted = [...pending, ...partial, ...rest];

    return NextResponse.json(sorted);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// --- POST handler to create a new commission ---
export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    // Accept fields
    const formData = await req.formData();

    const userName = formData.get("userName") as string;
    const amountStr = formData.get("amount");
    const details = formData.get("details") as string;
    const casinoGroupName = formData.get("casinoGroup") as string;

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
    // --- Validation ---
    if (!userName || typeof userName !== "string" || userName.trim() === "") {
      return NextResponse.json(
        { error: "Username is required." },
        { status: 400 }
      );
    }

    if (!amountStr || isNaN(Number(amountStr))) {
      return NextResponse.json(
        { error: "Amount is required and must be a valid number." },
        { status: 400 }
      );
    }
    const amount = parseFloat(amountStr as string);
    if (amount <= 0) {
      return NextResponse.json(
        { error: "Amount must be greater than zero." },
        { status: 400 }
      );
    }

    if (!details || typeof details !== "string" || details.trim() === "") {
      return NextResponse.json(
        { error: "Commission details are required." },
        { status: 400 }
      );
    }

    // Upload attachments
    const attachments: File[] = formData.getAll("attachment") as File[];
    const attachmentData: {
      url: string;
      filename: string;
      mimetype: string;
    }[] = [];
    for (const file of attachments) {
      if (file && typeof file === "object" && file.size > 0) {
        try {
          const blob = await put(file.name, file, {
            access: "public",
            addRandomSuffix: true,
          });
          attachmentData.push({
            url: blob.url,
            filename: file.name,
            mimetype: file.type || "",
          });
        } catch (err) {
          console.error("Attachment upload error:", err);
          return NextResponse.json(
            { error: "Attachment upload failed." },
            { status: 500 }
          );
        }
      }
    }

    // Construct the data based on role
    const commissionData: any = {
      userName,
      amount,
      details,
      casinoGroupId: casinoGroup.id,
      userId: currentUser.id,
      attachments: {
        createMany: {
          data: attachmentData,
        },
      },
    };

    // --- Main transaction ---
    try {
      const result = await prisma.$transaction(async (prisma) => {
        // Save to DB
        const commission = await prisma.commission.create({
          data: commissionData,
          include: {
            attachments: true,
          },
        });

        await prisma.commissionLogs.create({
          data: {
            commissionId: commission.id,
            action: "PENDING",
            performedById: currentUser.id,
          },
        });
        const pendingCount = await prisma.commission.count({
          where: {
            status: "PENDING",
            casinoGroupId: casinoGroup.id, // or use casinoGroupName if you join by name
          },
        });

        await pusher.trigger(
          `commission-${casinoGroupName.toLowerCase()}`, // channel name
          "commission-pending-count", // event name
          { count: pendingCount }
        );

        // Get all tagged users for this notification
        const taggedUserIds = await prisma.user
          .findMany({
            where: {
              role: {
                in: [
                  ADMINROLES.SUPERADMIN,
                  ADMINROLES.ADMIN,
                  ADMINROLES.ACCOUNTING,
                  ADMINROLES.LOADER,
                  ADMINROLES.TL,
                ],
              },
              casinoGroups: {
                some: {
                  id: casinoGroup.id, // 🔥 only users in this casino group
                },
              },
              active: true,
            },
            select: {
              id: true,
            },
          })
          .then((users) => users.map((user) => user.id));

        // For each user, create the notification and send via Pusher
        await Promise.all(
          taggedUserIds.map(async (userId) => {
            const notification = await prisma.notifications.create({
              data: {
                userId,
                message: `${currentUser.username} requested a Commission: "${commission.amount}" in ${casinoGroupName}.`,
                link: `/${casinoGroupName.toLowerCase()}/cash-outs/${
                  commission.id
                }`,
                isRead: false,
                type: "commission",
                actor: currentUser.username,
                subject: commission.amount.toLocaleString(),
                casinoGroup: casinoGroupName,
              },
            });

            // You can use a specific event name for this type
            await pusher.trigger(
              `user-notify-${userId}`,
              "notifications-event", // Event name by notification type
              notification
            );
          })
        );

        await emitCommissionUpdated({
          transactionId: commission.id,
          casinoGroup: casinoGroupName,
          action: "CREATED",
        });

        return commission;
      });

      return NextResponse.json({ success: true, result });
    } catch (dbErr: any) {
      // Prisma error messages can be cryptic, so give a generic error and log:
      console.error("Database error during commission creation:", dbErr);
      return NextResponse.json(
        {
          error:
            "Failed to create commission. Please check your data and try again.",
        },
        { status: 500 }
      );
    }
  } catch (e: any) {
    // Catch-all for unexpected errors
    console.error("Unexpected error creating commission:", e);
    return NextResponse.json(
      { error: "Unexpected server error. Please try again later." },
      { status: 500 }
    );
  }
}

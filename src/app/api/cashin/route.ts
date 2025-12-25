import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { ADMINROLES, NETWORKROLES } from "@/lib/types/role";
import { pusher } from "@/lib/pusher";
import { emitCashinUpdated } from "@/actions/server/emitCashinUpdated";

const STATUS_SORT = {
  ACCOMMODATING: 1,
  PARTIAL: 2,
  PENDING: 3,
  COMPLETED: 4,
  REJECTED: 5,
};

// --- GET handler to fetch all cashins with attachments and threads ---
export async function GET(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get casinoGroup from URL search params
    const url = new URL(req.url);
    const casinoGroup = url.searchParams.get("casinoGroup");

    // Build base where clause for admin roles
    const whereClause: any = {
      status: { not: "PENDING" }, // 🔹 Exclude ACCOMMODATING
    };
    // If casinoGroup is provided, add filter
    if (casinoGroup) {
      whereClause.casinoGroup = {
        name: { equals: casinoGroup, mode: "insensitive" },
      };
    }

    // Filter roles: include admin + network roles (customize as needed)
    const allowedRoles = [
      ...Object.values(ADMINROLES),
      ...Object.values(NETWORKROLES),
    ];
    const cashins = await prisma.cashin.findMany({
      where: whereClause,
      include: {
        attachments: true,
        cashinThreads: true,
        user: {
          where: { role: { in: allowedRoles } },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    // Now sort in-memory
    cashins.sort((a, b) => STATUS_SORT[a.status] - STATUS_SORT[b.status]);

    return NextResponse.json(cashins);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// --- POST handler to create a new cashin ---
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
        { error: "Cashin details are required." },
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
    const cashinData: any = {
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
        const cashin = await prisma.cashin.create({
          data: cashinData,
          include: {
            attachments: true,
          },
        });

        await prisma.cashinLogs.create({
          data: {
            cashinId: cashin.id,
            action: "PENDING",
            performedById: currentUser.id,
          },
        });
        const pendingCount = await prisma.cashin.count({
          where: {
            status: "PENDING",
            casinoGroupId: casinoGroup.id, // or use casinoGroupName if you join by name
          },
        });

        await pusher.trigger(
          `cashin-${casinoGroupName.toLowerCase()}`, // channel name
          "cashin-pending-count", // event name
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
                message: `${currentUser.username} requested a Cashin: "${cashin.amount}" in ${casinoGroupName}.`,
                link: `/${casinoGroupName.toLowerCase()}/cash-ins/${cashin.id}`,
                isRead: false,
                type: "cashin",
                actor: currentUser.username,
                subject: cashin.amount.toLocaleString(),
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

        await emitCashinUpdated({
          transactionId: cashin.id,
          casinoGroup: casinoGroupName,
          action: "CREATED",
        });

        return cashin;
      });

      return NextResponse.json({ success: true, result });
    } catch (dbErr: any) {
      // Prisma error messages can be cryptic, so give a generic error and log:
      console.error("Database error during cashin creation:", dbErr);
      return NextResponse.json(
        {
          error:
            "Failed to create cashin. Please check your data and try again.",
        },
        { status: 500 }
      );
    }
  } catch (e: any) {
    // Catch-all for unexpected errors
    console.error("Unexpected error creating cashin:", e);
    return NextResponse.json(
      { error: "Unexpected server error. Please try again later." },
      { status: 500 }
    );
  }
}

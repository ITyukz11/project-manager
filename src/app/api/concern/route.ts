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

// --- GET handler to fetch all cashouts with attachments and threads ---
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
    const whereClause: any = {};

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
    const concerns = await prisma.concern.findMany({
      where: whereClause,
      include: {
        attachments: true,
        concernThreads: true,
        user: {
          where: { role: { in: allowedRoles } },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    // Now sort in-memory
    concerns.sort((a, b) => STATUS_SORT[a.status] - STATUS_SORT[b.status]);

    return NextResponse.json(concerns);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// --- POST handler to create a new cashout ---
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

    const subject = formData.get("subject") as string;
    const details = formData.get("details") as string;
    const casinoGroupName = formData.get("casinoGroup") as string;
    const users = formData.get("users") as string; // JSON string of user IDs

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
    if (!subject || typeof subject !== "string" || subject.trim() === "") {
      return NextResponse.json(
        { error: "Subject is required." },
        { status: 400 }
      );
    }

    if (!details || typeof details !== "string" || details.trim() === "") {
      return NextResponse.json(
        { error: "Concern details are required." },
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
    const concernData: any = {
      subject,
      details,
      casinoGroupId: casinoGroup.id,
      userId: currentUser.id,
      tagUsers: {
        connect: JSON.parse(users).map((id: string) => ({ id })),
      },
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
        const concern = await prisma.concern.create({
          data: concernData,
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

        // Notify casino group channel
        await pusher.trigger(
          `concern-${casinoGroupName.toLowerCase()}`, // channel name
          "concern-pending-count",
          { count: pendingCount }
        );

        // Notify each tagged user
        const taggedUserIds: string[] = JSON.parse(users);

        await Promise.all(
          taggedUserIds.map(async (userId) => {
            // 1. Create a notification in the DB
            await prisma.notifications.create({
              data: {
                userId: userId,
                message: `${currentUser.username} tagged you in a concern "${concern.subject}".`,
                link: `/${casinoGroupName.toLowerCase()}/concerns/${
                  concern.id
                }`,
                isRead: false,
                // Add type if you want: type: "concern"
              },
            });

            // 2. Send real-time notification
            await pusher.trigger(
              `user-notify-${userId}`, // user channel
              "concern-tagged", // event name
              {
                concernId: concern.id,
                subject: concern.subject,
                details: concern.details,
                casinoGroup: casinoGroupName,
                createdBy: currentUser.id,
              }
            );
          })
        );

        return concern;
      });
      return NextResponse.json({ success: true, result });
    } catch (dbErr: any) {
      // Prisma error messages can be cryptic, so give a generic error and log:
      console.error("Database error during concern creation:", dbErr);
      return NextResponse.json(
        {
          error:
            "Failed to create concern. Please check your data and try again.",
        },
        { status: 500 }
      );
    }
  } catch (e: any) {
    // Catch-all for unexpected errors
    console.error("Unexpected error creating concern:", e);
    return NextResponse.json(
      { error: "Unexpected server error. Please try again later." },
      { status: 500 }
    );
  }
}

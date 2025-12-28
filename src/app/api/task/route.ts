import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { ADMINROLES, NETWORKROLES } from "@/lib/types/role";
import { put } from "@vercel/blob";
import { pusher } from "@/lib/pusher";
import { emitTaskUpdated } from "@/actions/server/emitTaskUpdated";

// --- GET handler to fetch all tasks (with date range support) ---
export async function GET(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get filters from URL search params
    const url = new URL(req.url);
    const casinoGroup = url.searchParams.get("casinoGroup");

    // 👇 NEW: Get date range params, if any
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

    // Build business logic filter as in cashout/cashin/remittance
    const whereClause: any = {
      OR: [
        { status: "PENDING" },
        {
          NOT: { status: { in: ["PENDING"] } },
          ...(fromParam || toParam
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

    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        attachments: true,
        taskThreads: true,
        user: {
          where: { role: { in: allowedRoles } },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Group/Business sorting: pending, then rest by createdAt desc
    const pending = tasks.filter((x) => x.status === "PENDING");
    const rest = tasks.filter((x) => x.status !== "PENDING");
    const sorted = [...pending, ...rest];

    return NextResponse.json(sorted);
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
        { error: "Task details are required." },
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
    const taskData: any = {
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
        const task = await prisma.task.create({
          data: taskData,
          include: { attachments: true },
        });

        await prisma.taskLogs.create({
          data: {
            taskId: task.id,
            action: "PENDING",
            performedById: currentUser.id,
          },
        });
        const pendingCount = await prisma.task.count({
          where: {
            status: "PENDING",
            casinoGroupId: casinoGroup.id,
          },
        });

        // Notify casino group channel
        await pusher.trigger(
          `task-${casinoGroupName.toLowerCase()}`, // channel name
          "task-pending-count",
          { count: pendingCount }
        );

        // Notify each tagged user
        const taggedUserIds: string[] = JSON.parse(users);

        await Promise.all(
          taggedUserIds.map(async (userId) => {
            // 1. Create a notification in the DB
            const notification = await prisma.notifications.create({
              data: {
                userId,
                message: `${currentUser.username} initiated a Task: "${task.subject}" in ${casinoGroupName}.`,
                link: `/${casinoGroupName.toLowerCase()}/task/${task.id}`,
                isRead: false,
                type: "task",
                // Additional fields for front-end rich rendering:
                actor: currentUser.username,
                subject: task.subject,
                casinoGroup: casinoGroupName,
              },
            });

            // 2. Send real-time notification
            await pusher.trigger(
              `user-notify-${userId}`, // user channel
              "notifications-event", // event name
              notification
            );
          })
        );

        await emitTaskUpdated({
          transactionId: task.id,
          casinoGroup: casinoGroupName.toLowerCase(),
          action: "CREATED",
        });

        return task;
      });
      return NextResponse.json({ success: true, result });
    } catch (dbErr: any) {
      // Prisma error messages can be cryptic, so give a generic error and log:
      console.error("Database error during task creation:", dbErr);
      return NextResponse.json(
        {
          error: "Failed to create task. Please check your data and try again.",
        },
        { status: 500 }
      );
    }
  } catch (e: any) {
    // Catch-all for unexpected errors
    console.error("Unexpected error creating task:", e);
    return NextResponse.json(
      { error: "Unexpected server error. Please try again later." },
      { status: 500 }
    );
  }
}

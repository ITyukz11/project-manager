import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { emitCommissionUpdated } from "@/actions/server/emitCommissionUpdated";
import { verifyExternalJwt } from "@/lib/auth/verifyExternalJwt";
import { toUtcEndOfDay, toUtcStartOfDay } from "@/lib/utils/utc.utils";

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
      // old: fromDate = new Date(f.getFullYear(), f.getMonth(), f.getDate(), 0,0,0,0)
      fromDate = toUtcStartOfDay(fromParam, 8); // 8 = UTC+8
    }

    if (toParam) {
      toDate = toUtcEndOfDay(toParam, 8);
    }

    if (!fromParam || !toParam) {
      return NextResponse.json(
        { error: "Both 'from' and 'to' query parameters are required." },
        { status: 400 },
      );
    }

    // Build where clause
    const whereClause: any = {
      OR: [
        { status: "PENDING" },
        { status: "CLAIMED" },
        { status: "PARTIAL" }, // always include PENDING and PARTIAL
        {
          // other statuses with date range filter
          NOT: { status: { in: ["PENDING", "PARTIAL", "CLAIMED"] } },
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

    const commissions = await prisma.commission.findMany({
      where: whereClause,
      include: {
        attachments: true,
        _count: {
          select: {
            commissionThreads: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Business sorting: pending, partial, rest sorted by createdAt desc
    const claimed = commissions.filter((x) => x.status === "CLAIMED");
    const pending = commissions.filter((x) => x.status === "PENDING");
    const partial = commissions.filter((x) => x.status === "PARTIAL");
    const rest = commissions.filter(
      (x) =>
        x.status !== "PENDING" &&
        x.status !== "PARTIAL" &&
        x.status !== "CLAIMED",
    );
    const sorted = [...pending, ...claimed, ...partial, ...rest];

    return NextResponse.json(sorted);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// --- POST handler to create a new commission ---
export async function POST(req: Request) {
  try {
    /* -------------------------------------------
       1. JWT AUTH (replaces getCurrentUser)
    -------------------------------------------- */
    const authHeader = req.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized. Missing JWT token." },
        { status: 401 },
      );
    }

    const token = authHeader.replace("Bearer ", "");

    let currentUser: {
      id: string;
      username: string;
      role?: string;
    };

    try {
      const payload = verifyExternalJwt(token);

      currentUser = {
        id: payload.userId,
        username: payload.username,
        role: payload.role,
      };
    } catch (err) {
      console.error("JWT verification failed:", err);
      return NextResponse.json(
        { error: "Unauthorized. Invalid or expired token." },
        { status: 401 },
      );
    }

    /* -------------------------------------------
       2. FORM DATA (payload stays the same)
    -------------------------------------------- */
    const formData = await req.formData();

    const userName = formData.get("userName") as string;
    const role = formData.get("role") as string;
    const amountStr = formData.get("amount");
    const details = formData.get("details") as string;
    const casinoGroupName = formData.get("casinoGroup") as string;
    // const accountNumber = formData.get("accountNumber") as string;
    // const accountName = formData.get("accountName") as string;
    // const bankName = formData.get("bankName") as string;
    // const remarks = formData.get("remarks") as string;

    /* -------------------------------------------
       3. VALIDATION
    -------------------------------------------- */
    if (!userName?.trim()) {
      return NextResponse.json(
        { error: "Username is required." },
        { status: 400 },
      );
    }

    if (!amountStr || isNaN(Number(amountStr))) {
      return NextResponse.json(
        { error: "Amount must be a valid number." },
        { status: 400 },
      );
    }

    const amount = Number(amountStr);
    if (amount <= 0) {
      return NextResponse.json(
        { error: "Amount must be greater than zero." },
        { status: 400 },
      );
    }

    if (!details?.trim()) {
      return NextResponse.json(
        { error: "Commission details are required." },
        { status: 400 },
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
        { status: 400 },
      );
    }

    /* -------------------------------------------
       4. ATTACHMENTS
    -------------------------------------------- */
    const attachments = formData.getAll("attachment") as File[];
    const attachmentData: {
      url: string;
      filename: string;
      mimetype: string;
    }[] = [];

    for (const file of attachments) {
      if (file?.size > 0) {
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

    /* -------------------------------------------
       5. CREATE COMMISSION
    -------------------------------------------- */
    const result = await prisma.$transaction(async (prisma) => {
      const commission = await prisma.commission.create({
        data: {
          userName,
          role,
          amount,
          details,
          casinoGroupId: casinoGroup.id,
          attachments: {
            createMany: { data: attachmentData },
          },
        },
        include: { attachments: true },
      });

      await prisma.commissionLogs.create({
        data: {
          commissionId: commission.id,
          action: "PENDING",
        },
      });
      await emitCommissionUpdated({
        transactionId: commission.id,
        casinoGroup: casinoGroupName,
        action: "CREATED",
      });

      return commission;
    });

    return NextResponse.json({ success: true, result });
  } catch (err) {
    console.error("Commission POST error:", err);
    return NextResponse.json(
      { error: "Unexpected server error." },
      { status: 500 },
    );
  }
}

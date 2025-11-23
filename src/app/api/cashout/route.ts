import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { ADMINROLES, NETWORKROLES } from "@/lib/types/role";

// --- GET handler to fetch all cashouts with attachments and threads ---
export async function GET(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Filter roles: include admin + network roles (customize as needed)
    const allowedRoles = [
      ...Object.values(ADMINROLES),
      ...Object.values(NETWORKROLES),
    ];
    const cashouts = await prisma.cashout.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        attachments: true,
        cashoutThreads: true,
        user: {
          where: { role: { in: allowedRoles } },
        },
      },
    });

    return NextResponse.json(cashouts);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// --- POST handler to create a new cashout ---
export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Accept fields
    const formData = await req.formData();
    const userName = formData.get("userName") as string;
    const amount = parseFloat(formData.get("amount") as string);
    const mop = formData.get("mop") as string;
    const accName = formData.get("accName") as string;
    const accNumber = formData.get("accNumber") as string;
    const bankName = formData.get("bankName") as string;
    const loaderTip = parseFloat(formData.get("loaderTip") as string);
    const agentTip = parseFloat(formData.get("agentTip") as string);
    const masterAgentTip = parseFloat(formData.get("masterAgentTip") as string);

    // Upload attachments
    const attachments: File[] = formData.getAll("attachment") as File[];
    const attachmentData: {
      url: string;
      filename: string;
      mimetype: string;
    }[] = [];
    for (const file of attachments) {
      if (file && typeof file === "object" && file.size > 0) {
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

    // Construct the data based on role
    const cashoutData: any = {
      userName,
      amount,
      mop,
      accName,
      accNumber,
      bankName,
      loaderTip,
      agentTip,
      masterAgentTip,
      userId: currentUser.id,
      attachments: {
        createMany: {
          data: attachmentData,
        },
      },
    };

    const result = await prisma.$transaction(async (prisma) => {
      // Save to DB
      const cashout = await prisma.cashout.create({
        data: cashoutData,
        include: {
          attachments: true,
        },
      });

      await prisma.cashoutLogs.create({
        data: {
          cashoutId: cashout.id,
          action: "PENDING",
          performedById: currentUser.id,
        },
      });
    });

    return NextResponse.json({ success: true, result });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { pusher } from "@/lib/pusher";
import { emitCommissionUpdated } from "@/actions/server/emitCommissionUpdated";
import { put } from "@vercel/blob";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    console.log("PATCH /reject-commission called");

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      console.log("Unauthorized access attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: commissionId } = await params;
    console.log("Commission ID from params:", commissionId);

    if (!commissionId) {
      return NextResponse.json(
        { error: "No commission ID provided" },
        { status: 400 },
      );
    }

    const formData = await req.formData();

    const reason = formData.get("reason") as string;
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
            { status: 500 },
          );
        }
      }
    }
    const commission = await prisma.$transaction(async (tx) => {
      // 1️⃣ Fetch commission
      const commission = await tx.commission.findUnique({
        where: { id: commissionId },
        include: { casinoGroup: true },
      });

      console.log("Fetched commission:", commission);

      if (!commission) {
        throw new Error("Commission not found.");
      }

      // 2️⃣ Update commission status to REJECTED
      const updatedCommission = await tx.commission.update({
        where: { id: commissionId },
        data: {
          status: "REJECTED",
          reason: reason || null,
          attachments: {
            createMany: {
              data: attachmentData,
            },
          },
        },
      });

      console.log("Commission updated to REJECTED:", updatedCommission);

      // --- Post-DB: Notify and Emit Events ---
      try {
        // Trigger pending count for group
        const [commissionPendingCount] = await Promise.all([
          tx.commission.count({
            where: {
              status: "PENDING",
              casinoGroupId: commission.casinoGroupId,
            },
          }),
        ]);

        await pusher.trigger(
          `commission-${commission.casinoGroup.name.toLowerCase()}`, // channel name
          "commission-pending-count", // event name
          { count: commissionPendingCount },
        );

        // Custom emit handlers
        await emitCommissionUpdated({
          transactionId: commission.id,
          casinoGroup: commission.casinoGroup.name.toLowerCase(),
          action: "UPDATED",
        });
      } catch (notifyErr: any) {
        // You may want to log but NOT return 500 here, since DB changes succeeded
        console.error("Notification error:", notifyErr);
      }

      console.log("Pusher events emitted for commission updates");

      // 6️⃣ PATCH to qbet88_base
      const QBET88_BASE = process.env.QBET88_BASE_URL;
      console.log("Syncing with QBET88_BASE:", QBET88_BASE);

      try {
        const qbetPatchRes = await fetch(
          `${QBET88_BASE}/api/nxtlink/commission/${commission.id}/status`,
          {
            method: "PATCH",
            body: JSON.stringify({ status: "REJECTED" }),
            headers: {
              "Content-Type": "application/json",
            },
          },
        );

        console.log("qbet88 PATCH response status:", qbetPatchRes.status);

        if (!qbetPatchRes.ok) {
          const errMsg = await qbetPatchRes.text();
          console.error(
            "Failed to update commission status on qbet88:",
            errMsg,
          );
          // Include warning in response but do not fail the main transaction
          return NextResponse.json({
            success: true,
            commission: updatedCommission,
            warning: "Local update succeeded but failed to update qbet88",
            qbet88Response: errMsg,
          });
        } else {
          const resData = await qbetPatchRes.json().catch(() => null);
          console.log("qbet88 PATCH success response:", resData);
        }
      } catch (syncErr) {
        console.error("Error syncing with qbet88:", syncErr);
      }

      return updatedCommission;
    });

    console.log(
      "Transaction complete, returning updatedCommission:",
      commission,
    );

    return NextResponse.json({ success: true, commission });
  } catch (err: any) {
    console.error("Error claiming commission:", err);
    return NextResponse.json(
      { error: err.message || "Failed to claim commission." },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { pusher } from "@/lib/pusher";
import { emitCommissionUpdated } from "@/actions/server/emitCommissionUpdated";
import { emitCashoutUpdated } from "@/actions/server/emitCashoutUpdated";
import { ADMINROLES } from "@/lib/types/role";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    console.log("POST /claim-commission called");

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
    const details = formData.get("details") as string;

    console.log("Details received:", details);

    if (!details || typeof details !== "string" || details.trim() === "") {
      return NextResponse.json(
        { error: "Details are required" },
        { status: 400 },
      );
    }

    const cashout = await prisma.$transaction(async (tx) => {
      // 1️⃣ Atomically claim ONLY if still PENDING
      const claimResult = await tx.commission.updateMany({
        where: {
          id: commissionId,
          status: "PENDING",
        },
        data: {
          status: "CLAIMED",
        },
      });

      // 2️⃣ If no rows updated → already claimed
      if (claimResult.count === 0) {
        throw new Error("Commission already claimed.");
      }

      // 3️⃣ Now safely fetch the commission
      const commission = await tx.commission.findUnique({
        where: { id: commissionId },
        include: { casinoGroup: true },
      });

      if (!commission) {
        throw new Error("Commission not found.");
      }

      console.log("Fetched commission:", commission);

      if (!commission) {
        throw new Error("Commission not found.");
      }

      // 2️⃣ Update commission status to CLAIMED
      const updatedCommission = await tx.commission.update({
        where: { id: commissionId },
        data: { status: "CLAIMED" },
      });

      console.log("Commission updated to CLAIMED:", updatedCommission);

      // 3️⃣ Create cashout
      const cashout = await tx.cashout.create({
        data: {
          amount: commission.amount,
          userName: commission.userName,
          externalUserId: commission.externalUserId || null,
          details,
          userId: currentUser.id,
          casinoGroupId: commission.casinoGroupId,
          commissionId: commission.id,
        },
      });

      console.log("Cashout created:", cashout);

      // 4️⃣ Create cashout log
      await tx.cashoutLogs.create({
        data: {
          cashoutId: cashout.id,
          action: "PENDING",
          performedById: currentUser.id,
        },
      });

      console.log("Cashout log created");

      // --- Post-DB: Notify and Emit Events ---
      try {
        // Trigger pending count for group
        const [cashoutPendingCount, commissionPendingCount] = await Promise.all(
          [
            tx.cashout.count({
              where: {
                status: "PENDING",
                casinoGroupId: commission.casinoGroupId,
              },
            }),
            tx.commission.count({
              where: {
                status: "PENDING",
                casinoGroupId: commission.casinoGroupId,
              },
            }),
          ],
        );

        console.log("cashoutPendingCount:", cashoutPendingCount);
        console.log("commissionPendingCount:", commissionPendingCount);

        await pusher.trigger(
          `cashout-${commission.casinoGroup.name.toLowerCase()}`,
          "cashout-pending-count",
          { count: cashoutPendingCount },
        );

        await pusher.trigger(
          `commission-${commission.casinoGroup.name.toLowerCase()}`, // channel name
          "commission-pending-count", // event name
          { count: commissionPendingCount },
        );

        // Notify tagged users
        const taggedUsers = await prisma.user.findMany({
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
          },
          select: { id: true },
        });

        await Promise.all(
          taggedUsers.map(async (user) => {
            const notification = await prisma.notifications.create({
              data: {
                userId: user.id,
                message: `${currentUser.username} requested a Cashout: "${cashout.amount}" in ${commission.casinoGroup.name}.`,
                link: `/${commission.casinoGroup.name.toLowerCase()}/cash-outs/${cashout.id}`,
                isRead: false,
                type: "cashout",
                actor: currentUser.username,
                subject: cashout.amount.toLocaleString(),
                casinoGroup: commission.casinoGroup.name,
              },
            });
            await pusher.trigger(
              `user-notify-${user.id}`,
              "notifications-event",
              notification,
            );
          }),
        );

        // Custom emit handlers
        await emitCommissionUpdated({
          transactionId: commission.id,
          casinoGroup: commission.casinoGroup.name.toLowerCase(),
          action: "UPDATED",
        });
        await emitCashoutUpdated({
          transactionId: cashout.id,
          casinoGroup: commission.casinoGroup.name.toLowerCase(),
          action: "CREATED",
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
            body: JSON.stringify({ status: "CLAIMED" }),
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
            cashout: cashout,
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

      return cashout;
    });

    console.log("Transaction complete, returning cashout:", cashout);

    return NextResponse.json({ success: true, cashout });
  } catch (err: any) {
    console.error("Error claiming commission:", err);
    return NextResponse.json(
      { error: err.message || "Failed to claim commission." },
      { status: 500 },
    );
  }
}

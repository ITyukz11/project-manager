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
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: commissionId } = await params;
  const formData = await req.formData();
  const details = formData.get("details") as string;

  if (!details || details.trim() === "") {
    return NextResponse.json(
      { error: "Details are required" },
      { status: 400 },
    );
  }

  let commission: any;
  let cashout: any;

  try {
    /**
     * 🔥 STEP 1 — DATABASE TRANSACTION
     */
    const result = await prisma.$transaction(
      async (tx) => {
        const claimResult = await tx.commission.updateMany({
          where: {
            id: commissionId,
            status: "PENDING",
          },
          data: { status: "CLAIMED" },
        });

        if (claimResult.count === 0) {
          throw new Error("Commission already claimed.");
        }

        const commission = await tx.commission.findUnique({
          where: { id: commissionId },
          include: { casinoGroup: true },
        });

        if (!commission) throw new Error("Commission not found.");

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

        await tx.cashoutLogs.create({
          data: {
            cashoutId: cashout.id,
            action: "PENDING",
            performedById: currentUser.id,
          },
        });

        return { commission, cashout };
      },
      {
        timeout: 15000, // 15 seconds instead of default 5 seconds
      },
    );

    commission = result.commission;
    cashout = result.cashout;

    /**
     * 🌍 STEP 2 — EXTERNAL SYNC (STRICT MODE)
     * If this fails → we revert DB
     */
    const QBET88_BASE = process.env.QBET88_BASE_URL;

    const qbetPatchRes = await fetch(
      `${QBET88_BASE}/api/nxtlink/commission/${commission.id}/status`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CLAIMED" }),
      },
    );

    if (!qbetPatchRes.ok) {
      throw new Error("Failed to sync commission to QBET88");
    }

    /**
     * 🔔 STEP 3 — NOTIFICATIONS (optional strict)
     */
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

    return NextResponse.json({ success: true, cashout });
  } catch (err: any) {
    console.error("STRICT FAILURE:", err);

    /**
     * 🔁 MANUAL ROLLBACK
     * If something failed AFTER transaction commit
     */
    if (commission && cashout) {
      try {
        await prisma.$transaction(async (tx) => {
          await tx.cashoutLogs.deleteMany({
            where: { cashoutId: cashout.id },
          });

          await tx.cashout.delete({
            where: { id: cashout.id },
          });

          await tx.commission.update({
            where: { id: commission.id },
            data: { status: "PENDING" },
          });
        });

        console.log("Rollback successful.");
      } catch (rollbackErr) {
        console.error("Rollback failed:", rollbackErr);
      }
    }

    return NextResponse.json(
      { error: err.message || "Transaction failed completely." },
      { status: 500 },
    );
  }
}

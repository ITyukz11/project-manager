import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ADMINROLES } from "@/lib/types/role";
import { pusher } from "@/lib/pusher";
import { emitCustomerSupportUpdated } from "@/actions/server/emitCustomerSupportUpdated";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = (await params).id;
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { status } = await req.json();
  if (!status) {
    return NextResponse.json({ error: "Missing status" }, { status: 400 });
  }

  try {
    // 1. Fetch the customerSupport to check the creator
    const customerSupport = await prisma.customerSupport.findUnique({
      where: { id },
      include: { casinoGroup: true },
    });

    if (!customerSupport) {
      return NextResponse.json(
        { error: "CustomerSupport not found" },
        { status: 404 }
      );
    }

    // 2. Check authorization:  creator, admin, or superadmin
    const isCreator = customerSupport.userId === session.user.id;
    const isAdmin = session.user.role === ADMINROLES.ADMIN;
    const isSuperAdmin = session.user.role === ADMINROLES.SUPERADMIN;

    if (!isCreator && !isAdmin && !isSuperAdmin) {
      return NextResponse.json(
        {
          error:
            "Unauthorized.  Only the creator, admins, or superadmins can update status",
        },
        { status: 403 }
      );
    }

    // 3. Update the customerSupport status
    const updatedCustomerSupport = await prisma.customerSupport.update({
      where: { id },
      data: { status },
      include: { casinoGroup: true },
    });

    // 4. Log this status change in CustomerSupportLogs
    await prisma.customerSupportLogs.create({
      data: {
        action: status,
        customerSupportId: id,
        performedById: session.user.id,
      },
    });

    // 5. Get updated pending count for this casinoGroup
    const pendingCount = await prisma.customerSupport.count({
      where: {
        status: "PENDING",
        casinoGroupId: updatedCustomerSupport.casinoGroupId,
      },
    });

    // 6. Emit Pusher event for the clients
    await pusher.trigger(
      `customerSupport-${updatedCustomerSupport.casinoGroup.name.toLowerCase()}`,
      "customerSupport-pending-count",
      { count: pendingCount }
    );

    await emitCustomerSupportUpdated({
      transactionId: customerSupport.id,
      casinoGroup: customerSupport.casinoGroup.name.toLowerCase(),
      action: "UPDATED",
    });

    return NextResponse.json({
      success: true,
      customerSupport: updatedCustomerSupport,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "An error occurred" },
      { status: 500 }
    );
  }
}

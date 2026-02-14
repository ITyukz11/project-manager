import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { ADMINROLES } from "@/lib/types/role";

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!(session && session.user.role !== ADMINROLES.SUPERADMIN)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const payload = await req.json();

    // Create DpayTransaction in DB
    // const transaction = await prisma.dpayTransaction.create({
    //   data: {
    //     casinoGroupId: payload.casinoGroupId,
    //     userId: payload.userId,
    //     userName: payload.userName,
    //     referenceUserId: payload.referenceUserId, // ✅ random ID inserted
    //     type: payload.type,
    //     amount: payload.amount,
    //     channel: payload.channel,
    //     status: "PENDING",
    //     rawRequest: payload,
    //   },
    // });

    // Send request to gateway API
    const resp = await fetch(
      `${process.env.PROXY_BASE_URL}/api/create-cashout`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // body: JSON.stringify({ ...payload }), // include it for the gateway
        body: JSON.stringify(payload),
      },
    );

    const data = await resp.json();

    // Optionally, update gateway response
    // await prisma.dpayTransaction.update({
    //   where: { id: transaction.id },
    //   data: { rawGatewayResponse: data },
    // });

    return NextResponse.json(data, { status: resp.status });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || String(err) },
      { status: 500 },
    );
  }
}

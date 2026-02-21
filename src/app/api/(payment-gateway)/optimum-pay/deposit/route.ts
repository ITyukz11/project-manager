// app/api/deposit/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const PROXY_BASE_URL = process.env.PROXY_OPTIMUMPAY_BASE_URL;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.casino || !body.hashed_mem_id || !body.amount) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const casinoGroup = await prisma.casinoGroup.findFirst({
      where: { name: { equals: body.casino, mode: "insensitive" } },
      select: { id: true },
    });

    if (!casinoGroup) {
      return NextResponse.json({ error: "Invalid casino" }, { status: 400 });
    }

    const amount = Number(body.amount);
    if (isNaN(amount)) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    // 1️⃣ Create transaction
    const newTransaction = await prisma.optimumPayTransaction.create({
      data: {
        casinoGroupId: casinoGroup.id,
        userId: body.hashed_mem_id,
        userName: body.merchant_user || "Unknown",
        referenceUserId: "",
        type: body.type || "CASHIN",
        amount,
        status: "PENDING",
        qbetStatus: "PENDING",
        remarks: body.note || "",
        platform: body.platform || "PC",
        rawRequest: body,
      },
    });

    const merchantOrderNo = newTransaction.id;

    // 2️⃣ Send to proxy
    const proxyBody = {
      ...body,
      merchant_order_no: merchantOrderNo,
    };

    const response = await fetch(`${PROXY_BASE_URL}/api/deposit-optimum-pay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(proxyBody),
    });

    const data = await response.json(); // ✅ parse JSON

    console.log("📥 Gateway response:", data);

    // 3️⃣ Update transaction
    await prisma.optimumPayTransaction.update({
      where: { id: newTransaction.id },
      data: {
        rawGatewayResponse: data,

        // gateway status (1 = request accepted, not completed yet)
        status: data.status === 1 ? "PROCESSING" : "FAILED",

        sign: data.sign,
        note: data.note,
        transaction_url: data.transaction_url,
        trans_id: String(data.trans_id),
        trans_time: data.trans_time,
      },
    });

    return NextResponse.json(data, { status: response.status });
  } catch (err: any) {
    console.error("❌ Error calling deposit proxy:", err);
    return NextResponse.json(
      { error: "Failed to call deposit proxy" },
      { status: 500 },
    );
  }
}

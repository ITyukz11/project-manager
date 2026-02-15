// app/api/deposit/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // adjust path if needed

const PROXY_BASE_URL = process.env.PROXY_OPTIMUMPAY_BASE_URL;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    console.log("📥 Received deposit request:", body);
    if (!body.casino || !body.hashed_mem_id || !body.amount) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const casinoGroupId = await prisma.casinoGroup.findUnique({
      where: { name: body.casino },
      select: { id: true },
    });

    if (!casinoGroupId) {
      return NextResponse.json({ error: "Invalid casino" }, { status: 400 });
    }

    const amount = parseFloat(body.amount);
    if (isNaN(amount)) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const newTransaction = await prisma.optimumPayTransaction.create({
      data: {
        casinoGroupId: casinoGroupId.id,
        userId: body.hashed_mem_id,
        userName: body.merchant_user || "Unknown", // ensure non-empty string
        referenceUserId: "", // will update after gateway
        type: body.type || "CASHIN",
        amount,
        status: "PENDING",
        qbetStatus: "PENDING",
        remarks: body.note || "",
        platform: body.platform || "PC",
        rawRequest: body,
      },
    });

    // --- 2️⃣ Use the inserted record ID as merchant_order_no ---
    const merchantOrderNo = newTransaction.id;

    const proxyBody = {
      ...body,
      merchant_order_no: merchantOrderNo, // overwrite with our transaction ID
    };

    console.log("💾 Created OptimumPayTransaction:", newTransaction);
    console.log("📤 Sending to proxy with merchant_order_no:", merchantOrderNo);

    // --- 3️⃣ Forward request to Express proxy ---
    const response = await fetch(`${PROXY_BASE_URL}/api/deposit-optimum-pay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(proxyBody),
    });

    const text = await response.text();

    // --- 4️⃣ Update transaction with gateway response ---
    await prisma.optimumPayTransaction.update({
      where: { id: newTransaction.id },
      data: {
        rawGatewayResponse: text, // store the raw response
      },
    });

    return new NextResponse(text, { status: response.status });
  } catch (err: any) {
    console.error("❌ Error calling deposit proxy:", err);
    return NextResponse.json(
      { error: "Failed to call deposit proxy" },
      { status: 500 },
    );
  }
}

// app/api/optimum-pay/receive-payment-callback/route.ts
import { NextRequest, NextResponse } from "next/server";

// Optionally, you can verify the gateway's signature here
function verifySignature(payload: any): boolean {
  // Implement signature verification if provided
  // For now, return true for testing
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("Deposit Callback received:", body);

    // Verify signature
    const valid = verifySignature(body);
    if (!valid) {
      console.warn("Invalid signature on deposit callback");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // Example: Update your database here
    // await prisma.deposit.update({
    //   where: { trans_id: body.trans_id },
    //   data: {
    //     status: body.status,
    //     amount: body.amount,
    //     transaction_url: body.transaction_url,
    //     qr_image_url: body.qr_image_url,
    //     trans_time: new Date(body.trans_time),
    //     error_code: body.error_code,
    //     error_msg: body.error_msg,
    //   },
    // });

    // Always respond 200 OK to acknowledge receipt
    return NextResponse.json({ status: "ok" });
  } catch (err: any) {
    console.error("Error handling deposit callback:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

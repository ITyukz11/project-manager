import md5 from "crypto-js/md5";

// const API_URL = process.env.QBET88_API_URL_TRANSACTION!;
const OP_CODE = process.env.QBET88_OP_CODE!;
const SECRET_KEY = process.env.QBET88_API_KEY!;

export async function createTransaction({
  id,
  txn,
  type,
  amount,
}: {
  id: string;
  txn: string;
  type: "DEPOSIT" | "WITHDRAW";
  amount: string | number;
}) {
  const request_time = Math.floor(Date.now() / 1000).toString();

  const sign = md5(OP_CODE + request_time + "gateway" + SECRET_KEY).toString();

  const body = {
    batch_requests: [
      {
        id,
        type: type.toUpperCase(),
        amount: amount.toString(),
        txn,
      },
    ],
    op_code: OP_CODE,
    request_time,
    sign,
  };

  // Add console logs
  console.log(
    "createTransaction - Request body:",
    JSON.stringify(body, null, 2)
  );
  console.log(
    "createTransaction - Sending API request to:",
    `${process.env.BASE_URL}/api/droplet/qbet88/gateway`
  );

  try {
    const res = await fetch(
      `${process.env.BASE_URL}/api/droplet/qbet88/gateway`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    const data = await res.json();

    console.log(
      "createTransaction - Response status:",
      res.status,
      "| ok:",
      res.ok
    );
    console.log(
      "createTransaction - Response data:",
      JSON.stringify(data, null, 2)
    );

    return { ok: res.ok, status: res.status, data };
  } catch (error) {
    console.error("createTransaction - API error:", error);
    return { ok: false, error };
  }
}

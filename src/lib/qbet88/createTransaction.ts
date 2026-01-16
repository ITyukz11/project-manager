import md5 from "crypto-js/md5";

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
      { id, txn, type: type.toUpperCase(), amount: amount.toString() },
    ],
    op_code: OP_CODE,
    request_time,
    sign,
  };

  console.log("createTransaction - Request body:", body);

  try {
    const url =
      typeof window === "undefined"
        ? `${process.env.QBET88_PROXY_URL}/api/qbet88/transaction`
        : "/api/droplet/qbet88/transaction";

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    console.log("createTransaction - Response:", data);

    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    console.error("createTransaction - API error:", err);
    return { ok: false, error: err };
  }
}

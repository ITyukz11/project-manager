export async function fetchQBetBalance(
  member_account: string
): Promise<string> {
  if (!member_account) throw new Error("No member_account provided");
  const res = await fetch("/api/droplet/qbet88/balance", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ member_account }),
  });
  if (!res.ok) throw new Error("Failed to fetch balance");
  const data = await res.json();
  const result = data.data?.[0];
  if (!result || result.code !== 0)
    throw new Error("User not found or API error");
  return result.balance ?? "0.00";
}

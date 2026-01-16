"use client";

import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";

const Page = () => {
  const [result, setResult] = useState<any>(null);
  const [memberAccount, setMemberAccount] = useState("");
  const [txn, setTxn] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"DEPOSIT" | "WITHDRAW">("DEPOSIT");
  const [loading, setLoading] = useState(false);
  const [balanceResult, setBalanceResult] = useState<any>(null);
  const [error, setError] = useState("");

  console.log("memberAccount:", memberAccount);
  // ================= QBET88 Balance =================
  const fetchBalance = async () => {
    if (!memberAccount) return setError("Please enter a member account");

    setLoading(true);
    setError("");
    setBalanceResult(null);
    setResult(null);

    try {
      const res = await fetch("/api/droplet/qbet88/balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ member_account: memberAccount }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
      } else {
        setBalanceResult(data);
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch balance");
    } finally {
      setLoading(false);
    }
  };

  // ================= QBET88 Transaction =================
  const submitTransaction = async () => {
    if (!memberAccount || !txn || !amount) {
      return setError("Please enter member account, txn, and amount");
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/droplet/qbet88/transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: memberAccount,
          txn,
          type,
          amount,
        }),
      });

      const data = await res.json();
      setResult({ transaction: data });
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to submit transaction");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-6 max-w-2xl mx-auto">
      {/* ================= QBET88 Balance Section ================= */}
      <div className="p-4 border rounded space-y-2">
        <Label>QBET88 Balance</Label>
        <input
          type="text"
          placeholder="Enter member account"
          value={memberAccount}
          onChange={(e) => setMemberAccount(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded"
        />
        <button
          onClick={fetchBalance}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          {loading ? "Fetching..." : "Check Balance"}
        </button>

        {balanceResult && (
          <pre className="mt-2 bg-gray-100 p-2 rounded text-sm overflow-auto">
            {JSON.stringify(balanceResult, null, 2)}
          </pre>
        )}
      </div>

      <Separator />

      {/* ================= QBET88 Transaction Section ================= */}
      <div className="p-4 border rounded space-y-2">
        <Label>Deposit / Withdraw Test</Label>

        <input
          type="text"
          placeholder="Transaction ID (txn)"
          value={txn}
          onChange={(e) => setTxn(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded"
        />

        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded"
        />

        <select
          value={type}
          onChange={(e) => setType(e.target.value as "DEPOSIT" | "WITHDRAW")}
          className="w-full p-2 border border-gray-300 rounded"
        >
          <option value="DEPOSIT">Deposit</option>
          <option value="WITHDRAW">Withdraw</option>
        </select>

        <button
          onClick={submitTransaction}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
        >
          {loading ? "Submitting..." : "Submit Transaction"}
        </button>

        {error && <div className="text-red-500">{error}</div>}

        {result && (
          <pre className="mt-2 bg-gray-100 p-2 rounded text-sm overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
};

export default Page;

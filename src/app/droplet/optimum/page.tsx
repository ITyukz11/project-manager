"use client";

import { useState } from "react";

export const getPlatform = () => {
  if (typeof navigator === "undefined") return "PC";
  const ua = navigator.userAgent;
  return /Mobi|Android|iPhone|iPad|iPod/i.test(ua) ? "MOBILE" : "PC";
};

export default function DepositTestPage() {
  const [loading, setLoading] = useState<string | null>(null);

  const [testResult, setTestResult] = useState<string | null>(null);
  const [depositResult, setDepositResult] = useState<string | null>(null);
  const [balanceResult, setBalanceResult] = useState<string | null>(null);

  // ---------------- TEST CONNECTION ----------------
  const handleTestConnection = async () => {
    setLoading("test");
    setTestResult(null);

    try {
      const res = await fetch("/api/optimum-pay/test");
      const data = await res.json();
      setTestResult(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setTestResult("Error: " + err.message);
    }

    setLoading(null);
  };

  // ---------------- DEPOSIT ----------------
  const handleDeposit = async () => {
    setLoading("deposit");
    setDepositResult(null);

    try {
      const res = await fetch("/api/optimum-pay/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          casinoGroupId: "8daa7105-b5a6-4b5d-9cdf-0bfd1640ce96",
          amount: "1000",
          service_type: "999",
          bank_code: "3021",
          callback_url:
            "https://nxtlink2.xyz/api/optimum-pay/receive-payment-callback",
          hashed_mem_id: "T4G0NAZPVYLRISYV",
          merchant_user: "nxtlink",
          note: "Deposit test",
          platform: getPlatform(),
          risk_level: 1,
        }),
      });

      const text = await res.text();
      setDepositResult(text);
    } catch (err: any) {
      setDepositResult("Error: " + err.message);
    }

    setLoading(null);
  };

  // ---------------- BALANCE ----------------
  const handleCheckBalance = async () => {
    setLoading("balance");
    setBalanceResult(null);

    try {
      const res = await fetch("/api/optimum-pay/balance", {
        method: "POST",
      });

      const text = await res.text();
      setBalanceResult(text);
    } catch (err: any) {
      setBalanceResult("Error: " + err.message);
    }

    setLoading(null);
  };

  // ---------------- UI ----------------
  const card =
    "rounded-2xl border bg-white dark:bg-zinc-900 dark:border-zinc-700 shadow-sm p-5 space-y-4";

  const button =
    "px-4 py-2 rounded-lg text-white font-medium disabled:opacity-50";

  const output =
    "bg-gray-100 dark:bg-zinc-800 text-sm p-4 rounded-xl overflow-x-auto";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 p-6 space-y-6">
      <h1 className="text-3xl font-bold">optimum-pay Gateway Tester</h1>

      {/* TEST CONNECTION */}
      <div className={card}>
        <h2 className="font-semibold text-lg">Connection</h2>

        <button
          onClick={handleTestConnection}
          disabled={loading !== null}
          className={`${button} bg-blue-600 hover:bg-blue-700`}
        >
          {loading === "test" ? "Testing..." : "Test Connection"}
        </button>

        {testResult && <pre className={output}>{testResult}</pre>}
      </div>

      {/* DEPOSIT */}
      <div className={card}>
        <h2 className="font-semibold text-lg">Deposit</h2>

        <button
          onClick={handleDeposit}
          disabled={loading !== null}
          className={`${button} bg-green-600 hover:bg-green-700`}
        >
          {loading === "deposit" ? "Processing..." : "Test Deposit"}
        </button>

        {depositResult && <pre className={output}>{depositResult}</pre>}
      </div>

      {/* BALANCE */}
      <div className={card}>
        <h2 className="font-semibold text-lg">Balance</h2>

        <button
          onClick={handleCheckBalance}
          disabled={loading !== null}
          className={`${button} bg-purple-600 hover:bg-purple-700`}
        >
          {loading === "balance" ? "Checking..." : "Check Balance"}
        </button>

        {balanceResult && <pre className={output}>{balanceResult}</pre>}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";

const Page = () => {
  const [result, setResult] = useState<any>(null);

  // Individual test handler for each endpoint
  const handleTestDroplet = async () => {
    try {
      const res = await fetch("/api/droplet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: 100, userId: "demoUser" }),
      });
      const data = await res.json();
      setResult({ dropletTest: data });
    } catch (err) {
      console.error(err);
      alert("Failed to fetch droplet endpoint");
    }
  };

  const handleGetBanks = async () => {
    try {
      const res = await fetch("/api/droplet/payment/banks");
      const data = await res.json();
      setResult({ banks: data });
    } catch (err) {
      console.error(err);
      alert("Failed to fetch banks");
    }
  };

  const handleGetCashinMerchants = async () => {
    try {
      const res = await fetch("/api/droplet/payment/cashin-merchants");
      const data = await res.json();
      setResult({ cashinMerchants: data });
    } catch (err) {
      console.error(err);
      alert("Failed to fetch cash-in merchants");
    }
  };

  const handleGetCashoutMerchants = async () => {
    try {
      const res = await fetch("/api/droplet/payment/cashout-merchants");
      const data = await res.json();
      setResult({ cashoutMerchants: data });
    } catch (err) {
      console.error(err);
      alert("Failed to fetch cash-out merchants");
    }
  };

  const handleGetCashinTransaction = async () => {
    // Replace with a real transaction number to test.
    const transactionNumber = prompt("Enter CashIn Transaction Number:");
    if (!transactionNumber) return;

    try {
      const res = await fetch(
        `/api/droplet/payment/cashin-transaction?transactionNumber=${encodeURIComponent(
          transactionNumber
        )}`
      );
      const data = await res.json();
      setResult({ cashinTransaction: data });
    } catch (err) {
      console.error(err);
      alert("Failed to fetch cash-in transaction");
    }
  };

  const handleCreateCashin = async () => {
    try {
      const payload = {
        Channel: "gcash",
        Amount: 100.0,
        ReferenceUserId: "user123",
        NotificationUrl: "https://qbet88.vip/",
        SuccessRedirectUrl: "https://qbet88.vip/",
        CancelRedirectUrl: "https://qbet88.vip/",
      };
      const res = await fetch("/api/droplet/payment/create-cashin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setResult({ createCashin: data });
    } catch (err) {
      console.error(err);
      alert("Failed to create cash-in");
    }
  };

  const handleCreateCashout = async () => {
    try {
      const payload = {
        Amount: 1000,
        ReferenceUserId: "5465645",
        AccountNumber: "09458318180",
        HolderName: "Juan Cruz",
        Bank: "Gcash",
        BankCode: "PH_GXI",
        BankAccountType: "PERSONAL",
        RecipientMobileNumber: "09458318180",
      };
      const res = await fetch("/api/droplet/payment/create-cashout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setResult({ createCashout: data });
    } catch (err) {
      console.error(err);
      alert("Failed to create cash-out");
    }
  };

  const handleGetCashoutTransaction = async () => {
    // Replace with a real transaction number to test.
    const transactionNumber = prompt("Enter CashOut Transaction Number:");
    if (!transactionNumber) return;

    try {
      const res = await fetch(
        `/api/droplet/payment/cashout-transaction?transactionNumber=${encodeURIComponent(
          transactionNumber
        )}`
      );
      const data = await res.json();
      setResult({ cashoutTransaction: data });
    } catch (err) {
      console.error(err);
      alert("Failed to fetch cash-out transaction");
    }
  };

  return (
    <div className="p-4">
      <div className="space-x-2 space-y-2">
        <button
          onClick={handleTestDroplet}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Test Droplet POST
        </button>
        <button
          onClick={handleGetBanks}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Get Banks
        </button>
        <button
          onClick={handleGetCashinMerchants}
          className="bg-blue-700 text-white px-4 py-2 rounded"
        >
          Get CashIn Merchants
        </button>
        <button
          onClick={handleGetCashoutMerchants}
          className="bg-teal-700 text-white px-4 py-2 rounded"
        >
          Get CashOut Merchants
        </button>
        <button
          onClick={handleGetCashinTransaction}
          className="bg-purple-700 text-white px-4 py-2 rounded"
        >
          Get CashIn Transaction
        </button>
        <button
          onClick={handleCreateCashin}
          className="bg-pink-600 text-white px-4 py-2 rounded"
        >
          Create CashIn
        </button>
        <button
          onClick={handleCreateCashout}
          className="bg-orange-600 text-white px-4 py-2 rounded"
        >
          Create CashOut
        </button>
        <button
          onClick={handleGetCashoutTransaction}
          className="bg-yellow-700 text-white px-4 py-2 rounded"
        >
          Get CashOut Transaction
        </button>
      </div>
      {result && (
        <pre className="mt-4 bg-gray-100 p-4 rounded text-sm overflow-auto">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
};

export default Page;

"use client";

import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  DPAY_BANK_CASHOUTS,
  PAYMENT_METHODS_CASHOUT,
  QUICK_AMOUNTS,
} from "@/lib/constants/data";
import { useState } from "react";
import { toast } from "sonner";

interface CashOutContentProps {
  externalUserId?: string;
  userName?: string;
}

export function CashOutContent({
  externalUserId,
  userName,
}: CashOutContentProps) {
  const [selectedPayment, setSelectedPayment] = useState<
    "BankTransfer" | "E-Wallet" | null
  >(null);
  const [amount, setAmount] = useState("");
  const [selectedBank, setSelectedBank] = useState("");
  const [customBank, setCustomBank] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankCode, setBankCode] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleProceedToCashoutGateway = async () => {
    if (!selectedPayment) {
      toast.error("Please select a payment method");
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (!accountName || !accountNumber) {
      toast.error("Please enter valid account holder info");
      return;
    }
    const minAmount = 100;
    if (parseFloat(amount) < minAmount) {
      toast.error(`Minimum amount is ${minAmount}`);
      return;
    }

    if (!bankName) {
      toast.error("Please select or enter your bank name");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        Channel: selectedPayment,
        Amount: parseFloat(amount),
        ReferenceUserId: externalUserId,
        UserName: userName,
        NotificationUrl:
          "https://www.nxtlink.xyz/api/dpay/receive-payment-callback",
        SuccessRedirectUrl: "http://nxtlink.xyz/payment/success",
        CancelRedirectUrl: "https://qbet88.vip/",
        Type: "CASHOUT",
        AccountNumber: accountNumber,
        HolderName: accountName,
        Bank: bankName,
        BankCode: "", // Add real code if your e-wallet/bank system uses it
        BankAccountType: "PERSONAL", // Or "BUSINESS"
        RecipientMobileNumber: accountNumber, // Use for e-wallets
      };

      const res = await fetch("/api/dpay/payment/new-dpay-transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(
          data?.error || data?.message || "Failed to create cashout request."
        );
        setSubmitting(false);
        return;
      }

      const paymentUrl =
        data.PaymentUrl ||
        data.createCashout?.PaymentUrl ||
        data.createCashin?.PaymentUrl ||
        null;

      if (paymentUrl) {
        window.location.href = paymentUrl;
      } else {
        toast.success("Cashout request submitted, awaiting processing.");
        setSubmitting(false);
        // Optionally show a modal/status page here!
      }
    } catch (err) {
      toast.error("Network error. Try again!");
      setSubmitting(false);
      console.error(err);
    }
  };

  return (
    <Card>
      <CardContent className="space-y-4 sm:space-y-6">
        {/* Step 1: Payment Method Selection */}
        <div>
          <Label className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 block">
            Step 1. Select Payment Method
          </Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
            {PAYMENT_METHODS_CASHOUT.map((method) => (
              <Card
                key={method.id}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  selectedPayment === method.id
                    ? "ring-2 ring-primary shadow-lg"
                    : ""
                }`}
                onClick={() =>
                  setSelectedPayment(method.id as "BankTransfer" | "E-Wallet")
                }
              >
                <CardContent className="p-0 flex items-center justify-center">
                  <Image
                    src={method.icon}
                    alt={method.name}
                    width={150}
                    height={150}
                    className="rounded-xl"
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Step 2: Amount & Bank Details */}
        <div>
          <Label className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 block">
            Step 2. Enter Amount & Bank Details
          </Label>
          <div className="space-y-3 sm:space-y-4">
            {/* Amount */}
            <div>
              <Label htmlFor="cashout-amount" className="text-sm mb-2 block">
                Amount
              </Label>
              <Input
                id="cashout-amount"
                type="number"
                placeholder="₱ 100 - 50,000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-12"
                min={100}
              />
            </div>
            {/* Quick Amounts */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {QUICK_AMOUNTS.map((amt) => (
                <Button
                  key={amt}
                  variant="outline"
                  onClick={() => setAmount(amt.toString())}
                  className="h-10 sm:h-12 text-sm sm:text-base"
                >
                  ₱{amt}
                </Button>
              ))}
            </div>
            {/* Bank Selection */}
            <div>
              <Label htmlFor="bank-select" className="text-sm mb-2 block">
                Bank Name
              </Label>
              <Select
                value={bankCode}
                onValueChange={(value) => {
                  const bank = DPAY_BANK_CASHOUTS.find((b) => b.Code === value);

                  setBankCode(value); // ✅ Store code
                  setBankName(bank?.Name || ""); // ✅ Store name
                }}
              >
                <SelectTrigger className="w-full" size="lg">
                  <SelectValue placeholder="Select your bank" />
                </SelectTrigger>

                <SelectContent>
                  {DPAY_BANK_CASHOUTS.filter((bank) =>
                    selectedPayment === "BankTransfer"
                      ? !bank.IsEWallet
                      : bank.IsEWallet
                  ).map((bank, index) => (
                    <SelectItem key={index} value={bank.Code}>
                      {bank.Name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Account Name */}
            <div>
              <Label htmlFor="account-name" className="text-sm mb-2 block">
                Account Name
              </Label>
              <Input
                id="account-name"
                type="text"
                placeholder="Enter account holder name"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                className="h-12"
              />
            </div>
            {/* Account Number */}
            <div>
              <Label htmlFor="account-number" className="text-sm mb-2 block">
                Account Number
              </Label>
              <Input
                id="account-number"
                type="text"
                placeholder="Enter account number"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="h-12"
              />
            </div>
          </div>
        </div>
        {/* Submit */}
        <Button
          onClick={handleProceedToCashoutGateway}
          disabled={submitting}
          className="w-full h-12 sm:h-14 text-base sm:text-lg bg-primary hover:bg-primary/90"
        >
          {submitting ? "Please wait..." : "Submit Cash Out Request"}
        </Button>
      </CardContent>
    </Card>
  );
}

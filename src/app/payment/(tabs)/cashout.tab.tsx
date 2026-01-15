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
  BANK_ONLY,
  E_WALLET_BANK,
  PAYMENT_METHODS_CASHOUT,
  QUICK_AMOUNTS,
} from "@/lib/constants/data";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { PaymentMethod, QR_CODE_MAP } from "@/app/banking/page";
import { PaymentQRCodeDialog } from "./PaymentQRCodeDialog";

interface CashOutContentProps {
  username: string;
  externalUserId: string;
  balance: string;
  casino: string;
  setActiveTab: (tab: "cashin" | "cashout" | "history" | string) => void;
}

export function CashOutContent({
  username,
  externalUserId,
  balance,
  casino,
  setActiveTab,
}: CashOutContentProps) {
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | null>(
    null
  );
  const [amount, setAmount] = useState("");
  const [selectedBank, setSelectedBank] = useState<string>("");
  const [customBank, setCustomBank] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [showQRDialog, setShowQRDialog] = useState(false);

  // Memoize the bank display name
  const displayBankName = useMemo(() => {
    return selectedBank === "Other" ? customBank : selectedBank;
  }, [selectedBank, customBank]);

  const handleProceedToQR = useCallback(async () => {
    if (!username.trim()) {
      toast.error("Username is required");
      return;
    }

    if (!casino.trim()) {
      toast.error("Casino group is required");
      return;
    }

    if (!selectedPayment) {
      toast.error("Please select a payment method");
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    const minAmount = 100;
    if (parseFloat(amount) < minAmount) {
      toast.error(`Minimum amount is ${minAmount}`);
      return;
    }

    if (!selectedBank) {
      toast.error("Please select a bank");
      return;
    }
    if (selectedBank === "Other" && !customBank.trim()) {
      toast.error("Please enter your bank name");
      return;
    }
    if (!accountName.trim()) {
      toast.error("Please enter account name");
      return;
    }
    if (!accountNumber.trim()) {
      toast.error("Please enter account number");
      return;
    }

    setShowQRDialog(true);
  }, [
    username,
    casino,
    selectedPayment,
    amount,
    selectedBank,
    customBank,
    accountName,
    accountNumber,
  ]);

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
                onClick={() => setSelectedPayment(method.id as PaymentMethod)}
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
                value={selectedBank}
                onValueChange={(value) => {
                  setSelectedBank(value);
                  if (value !== "Other") setCustomBank("");
                }}
              >
                <SelectTrigger className="w-full" size="lg">
                  <SelectValue placeholder="Select your bank" />
                </SelectTrigger>

                <SelectContent>
                  {selectedPayment === "GCash/Maya"
                    ? E_WALLET_BANK.map((bank) => (
                        <SelectItem key={bank} value={bank}>
                          {bank}
                        </SelectItem>
                      ))
                    : BANK_ONLY.map((bank) => (
                        <SelectItem key={bank} value={bank}>
                          {bank}
                        </SelectItem>
                      ))}

                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Custom Bank */}
            {selectedBank === "Other" && (
              <div>
                <Label htmlFor="custom-bank" className="text-sm mb-2 block">
                  Enter Bank Name
                </Label>
                <Input
                  id="custom-bank"
                  type="text"
                  placeholder="Enter your bank name"
                  value={customBank}
                  onChange={(e) => setCustomBank(e.target.value)}
                  className="h-12"
                />
              </div>
            )}

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
          onClick={handleProceedToQR}
          className="w-full h-12 sm:h-14 text-base sm:text-lg bg-primary hover:bg-primary/90"
        >
          Submit Cash Out Request
        </Button>
      </CardContent>

      {/* QR Code & Receipt Upload Dialog */}
      <PaymentQRCodeDialog
        open={showQRDialog}
        onOpenChange={setShowQRDialog}
        activeTab={"cashout"}
        amount={amount}
        selectedPayment={selectedPayment}
        displayBankName={displayBankName}
        accountName={accountName}
        accountNumber={accountNumber}
        balance={balance}
        username={username}
        externalUserId={externalUserId}
        casino={casino}
        selectedBank={selectedBank}
        customBank={customBank}
        setActiveTab={setActiveTab}
      />
    </Card>
  );
}

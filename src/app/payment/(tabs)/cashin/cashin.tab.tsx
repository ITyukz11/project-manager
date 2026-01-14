"use client";

import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  PAYMENTGATEWAY_METHODS_CASHIN,
  QUICK_AMOUNTS,
} from "@/lib/constants/data";
import { useState } from "react";
import { toast } from "sonner";

export type PaymentGatewayMethod = "QRPH" | "GCash" | "Maya" | null;

interface CashInContentProps {
  externalUserId?: string;
  userName?: string;
}
export function CashInContent({
  externalUserId,
  userName,
}: CashInContentProps) {
  const [selectedPayment, setSelectedPayment] =
    useState<PaymentGatewayMethod | null>(null);
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleProceedToPaymentGateway = async () => {
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

    setSubmitting(true);

    try {
      // Prepare payload for the backend (generic for all payment types)
      const payload = {
        UserName: userName || "",
        Channel: selectedPayment,
        Amount: parseFloat(amount),
        ReferenceUserId: externalUserId,
        NotificationUrl:
          "https://www.nxtlink.xyz/api/dpay/receive-payment-callback",
        SuccessRedirectUrl: "http://nxtlink.xyz/payment/success",
        CancelRedirectUrl: "https://qbet88.vip/",
        Type: "CASHIN",
      };

      // Send to your dpay transaction route
      const res = await fetch("/api/dpay/payment/new-dpay-transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      // If request failed
      if (!res.ok) {
        toast.error(
          data?.error || data?.message || "Failed to create payment request."
        );
        setSubmitting(false);
        return;
      }

      // Accepts both data.PaymentUrl and data.createCashin.PaymentUrl fallback
      const paymentUrl =
        data.PaymentUrl ||
        data.createCashin?.PaymentUrl ||
        data.createCashout?.PaymentUrl ||
        null;

      if (paymentUrl) {
        window.location.href = paymentUrl;
      } else {
        toast.error("Payment URL not found in gateway response.");
        setSubmitting(false);
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
            {PAYMENTGATEWAY_METHODS_CASHIN.map((method) => (
              <Card
                key={method.id}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  selectedPayment === method.id
                    ? "ring-2 ring-primary shadow-lg"
                    : ""
                }`}
                onClick={() =>
                  setSelectedPayment(method.id as PaymentGatewayMethod)
                }
              >
                <CardContent className="relative p-0 flex items-center justify-center">
                  <Image
                    src={method.icon}
                    alt={method.name}
                    width={150}
                    height={150}
                    className="rounded-xl"
                  />
                  {/* Online indicator for chat-based payment */}
                  {method.id === "Chat-Based" && (
                    <span className="absolute top-2 right-15 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Step 2: Amount Input */}
        <div>
          <Label className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 block">
            Step 2. Enter Amount
          </Label>
          <div className="space-y-3 sm:space-y-4">
            <Input
              id="amount"
              type="number"
              placeholder="₱ 100 - 50,000"
              value={amount}
              disabled={submitting}
              onChange={(e) => setAmount(e.target.value)}
              className="text-base sm:text-lg h-12"
              min={100}
            />
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {QUICK_AMOUNTS.map((amt) => (
                <Button
                  key={amt}
                  variant="outline"
                  onClick={() => setAmount(amt.toString())}
                  className="h-10 sm:h-12 text-sm sm:text-base"
                  disabled={submitting}
                >
                  ₱{amt}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleProceedToPaymentGateway}
          disabled={!selectedPayment || amount.trim() === "" || submitting}
          className="w-full h-12 sm:h-14 text-base sm:text-lg bg-primary hover:bg-primary/90"
        >
          {submitting ? "Please wait..." : "Proceed to Payment"}
        </Button>
      </CardContent>
    </Card>
  );
}

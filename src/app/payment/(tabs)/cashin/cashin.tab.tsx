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
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useEffect } from "react";
import { DpayConfig } from "@prisma/client";
import { ChatBasedContent } from "./chatbased";
import { Skeleton } from "@/components/ui/skeleton";

export type PaymentGatewayMethod = "GCash" | "Maya" | "Chat-Based" | null;

interface CashInContentProps {
  externalUserId?: string;
  userName?: string;
  casino: string;
  killSwitch: DpayConfig | undefined;
  killSwitchLoading: boolean;
  enableChatBased: boolean;
  setEnableChatBased: (enable: boolean) => void;
  cashinId?: string | null;
  setCashinId: (id: string | null) => void;
}
export function CashInContent({
  externalUserId,
  userName,
  casino,
  killSwitch,
  killSwitchLoading,
  enableChatBased = false,
  setEnableChatBased,
  cashinId = null,
  setCashinId,
}: CashInContentProps) {
  const [selectedPayment, setSelectedPayment] =
    useState<PaymentGatewayMethod | null>(null);
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (submitting) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [submitting]);

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

    // If Chat-Based Cashin, call the chat-based endpoint
    if (selectedPayment === "Chat-Based") {
      setSubmitting(true);
      const toastId = toast.loading("Connecting to chat-based cashin...");

      try {
        const formData = new FormData();
        formData.append("type", "CASHIN");
        formData.append("username", userName || "");
        formData.append("externalUserId", externalUserId || "");
        formData.append("amount", amount);
        formData.append("paymentMethod", selectedPayment);
        formData.append("casinoGroupName", casino);
        formData.append("enableChatBased", "true");

        const response = await fetch("/api/transaction-request/chat-based", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_BANKING_API_KEY}`,
          },
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          toast.error(data?.error || "Failed to create Chat-Based transaction");
          setSubmitting(false);
          toast.dismiss(toastId);
          return;
        }

        // If the API returns a URL for redirect
        if (data.paymentUrl) {
          window.location.href = data.paymentUrl;
        } else {
          setCashinId(data.transaction.cashinId);
          toast.success("Chat-Based Cashin request submitted!");
          setEnableChatBased(true);
        }

        setSubmitting(false);
        toast.dismiss(toastId);
      } catch (err) {
        console.error(err);
        toast.error("Network error. Try again!");
        setSubmitting(false);
        toast.dismiss();
      }

      return; // exit early so the regular flow is skipped
    }

    // Otherwise, normal cash-in flow
    setSubmitting(true);
    try {
      const payload = {
        casinoGroupName: casino,
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

      const res = await fetch("/api/dpay/payment/new-dpay-transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(
          data?.error || data?.message || "Failed to create payment request.",
        );
        setSubmitting(false);
        return;
      }

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
      console.error(err);
      toast.error("Network error. Try again!");
      setSubmitting(false);
    }
  };

  const cashinDisabled = useMemo(
    () => killSwitch?.cashinGatewayEnabled || killSwitchLoading,
    [killSwitch, killSwitchLoading],
  );

  console.log("KillSwitch Status:", {
    killSwitch,
    killSwitchLoading,
    cashinDisabled,
  });

  return (
    <Card>
      {!enableChatBased ? (
        <CardContent className="space-y-4 sm:space-y-6">
          {/* Step 1: Select Payment Gateway*/}
          <div>
            <Label className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 block">
              Step 1: Select Payment Gateway
            </Label>
          </div>
          {/* Step 2: Payment Method Selection */}
          <div>
            <Label className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 block">
              Step 2. Select Payment Method
            </Label>
            <div
              className={`grid ${cashinDisabled ? "grid-cols-3" : "grid-cols-2"}  gap-2 sm:gap-4`}
            >
              {/* 🔄 Loading skeletons */}
              {killSwitchLoading &&
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={`skeleton-${i}`} className="h-36 " />
                ))}

              {/* Show all normal cashin methods, disabled if killswitch is active */}
              {!killSwitchLoading &&
                PAYMENTGATEWAY_METHODS_CASHIN.map((method) => {
                  if (method.id === "QRPH-RAN") return null; // skip empty entries
                  return (
                    <Card
                      key={method.id}
                      className={`relative transition-all ${
                        cashinDisabled
                          ? "cursor-not-allowed opacity-50"
                          : "cursor-pointer hover:shadow-lg"
                      } ${
                        selectedPayment === method.id && !cashinDisabled
                          ? "ring-2 ring-primary shadow-lg"
                          : ""
                      }`}
                      onClick={() => {
                        if (cashinDisabled) return;
                        setSelectedPayment(method.id as PaymentGatewayMethod);
                      }}
                    >
                      <CardContent className="relative p-0 flex items-center justify-center">
                        <Image
                          src={method.icon}
                          alt={method.name}
                          width={150}
                          height={150}
                          className="rounded-xl"
                        />
                        {cashinDisabled && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-xl">
                            <span className="text-white text-sm font-semibold tracking-wide">
                              DISABLED
                            </span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}

              {/* Show Chat-Based Cashin only when killswitch is active and not loading */}
              {cashinDisabled && !killSwitchLoading && (
                <Card
                  key="chat-based-cashin"
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    selectedPayment === "Chat-Based"
                      ? "ring-2 ring-primary shadow-lg"
                      : ""
                  }`}
                  onClick={() => setSelectedPayment("Chat-Based")}
                >
                  <CardContent className="relative p-0 flex items-center justify-center">
                    <Image
                      src="/logo/chat-based-logo.png"
                      alt="Chat-Based Cashin"
                      width={150}
                      height={150}
                      className="rounded-xl"
                    />
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Step 3: Amount Input */}
          <div>
            <Label className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 block">
              Step 3. Enter Amount
            </Label>
            <div className="space-y-3 sm:space-y-4">
              <Input
                id="amount"
                type="number"
                placeholder="₱ 100 - 50,000"
                value={amount}
                disabled={submitting || killSwitchLoading}
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
                    disabled={submitting || killSwitchLoading}
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
      ) : (
        <CardContent className="space-y-4 sm:space-y-6">
          <ChatBasedContent
            amount={amount}
            cashinId={cashinId}
            playerUsername={userName || ""}
            setEnableChatBased={setEnableChatBased}
            casinoLink={casino}
          />
        </CardContent>
      )}

      <Dialog open={submitting}>
        <DialogContent
          className="sm:w-fit text-center border-yellow-300 [&>button]:hidden"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogTitle>
            <p className="text-lg font-semibold tracking-wide text-yellow-400">
              PROCESSING...
            </p>
            <p className="text-sm text-muted-foreground">
              PLEASE DO NOT CLOSE BROWSER!
            </p>
          </DialogTitle>
          <div className="flex flex-col items-center gap-4 relative">
            <Image
              src={"/tube-spinner.svg"}
              width={150}
              height={150}
              alt="tube-spinner"
            />
            <span className="absolute top-14 text-2xl font-mono font-bold">
              {elapsedSeconds}s
            </span>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

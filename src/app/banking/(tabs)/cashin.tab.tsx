"use client";

import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PAYMENT_METHODS_CASHIN, QUICK_AMOUNTS } from "@/lib/constants/data";
import { PaymentMethod } from "../page";

import { Spinner } from "@/components/ui/spinner";
import { ChatBasedContent } from "./chatbased";
import { useMemo } from "react";

interface CashInContentProps {
  selectedPayment: PaymentMethod | null;
  setSelectedPayment: (method: PaymentMethod) => void;
  amount: string;
  setAmount: (amount: string) => void;
  handleProceedToQR: () => void;
  enableChatBased: boolean;
  setEnableChatBased: (enable: boolean) => void;
  usersData?: { id: string; username: string; role: string }[];
  cashinId?: string | null;
  chatBasedLoading?: boolean;
  casinoLink: string;
  playerUsername: string;
  referrer?: string;
  setReferrer?: (referrer: string) => void;
}

export function CashInContent({
  selectedPayment,
  setSelectedPayment,
  amount,
  setAmount,
  handleProceedToQR,
  enableChatBased = false,
  setEnableChatBased,
  chatBasedLoading = false,
  cashinId,
  casinoLink,
  playerUsername,
  referrer,
  setReferrer,
}: CashInContentProps) {
  const isRan = casinoLink?.toLowerCase() === "ran";

  const methodsToShow = PAYMENT_METHODS_CASHIN.filter((m) =>
    isRan ? m.id === "QRPH-RAN" : m.id !== "QRPH-RAN",
  );

  const quickAmountsToShow = useMemo(() => {
    return isRan ? [50, 100, 200, 300, 500, 1000] : QUICK_AMOUNTS;
  }, [isRan]);

  if (!casinoLink) {
    return <Spinner />;
  }

  return (
    <Card>
      {!enableChatBased ? (
        <CardContent className="space-y-4 sm:space-y-6">
          {/* Step 1: Payment Method Selection */}
          <div>
            <Label className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 block">
              Step 1. Select Payment Method
            </Label>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
              {methodsToShow.map((method) => (
                <Card
                  key={method.id}
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    selectedPayment === method.id
                      ? "ring-2 ring-primary shadow-lg"
                      : ""
                  }`}
                  onClick={() => setSelectedPayment(method.id as PaymentMethod)}
                >
                  <CardContent className="relative p-0 flex items-center justify-center">
                    <Image
                      src={method.icon}
                      alt={method.name}
                      width={150}
                      height={150}
                      className="rounded-xl"
                    />

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
                onChange={(e) => setAmount(e.target.value)}
                className="text-base sm:text-lg h-12"
              />

              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {quickAmountsToShow.map((amt) => (
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
            </div>
          </div>
          <div>
            <Label className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 block">
              Step 3. Referrer
            </Label>

            <div className="space-y-3 sm:space-y-4">
              <Input
                id="referrer"
                placeholder="Enter referrer username (optional)"
                value={referrer}
                onChange={(e) => setReferrer?.(e.target.value)}
                className="text-base sm:text-lg h-12"
              />
            </div>
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleProceedToQR}
            disabled={
              !selectedPayment || amount.trim() === "" || chatBasedLoading
            }
            className="w-full h-12 sm:h-14 text-base sm:text-lg bg-primary hover:bg-primary/90"
          >
            {chatBasedLoading ? (
              <>
                <Spinner /> Entering Chat-Based Cashin...
              </>
            ) : (
              "Proceed to Payment"
            )}
          </Button>
        </CardContent>
      ) : (
        <CardContent className="space-y-4 sm:space-y-6">
          <ChatBasedContent
            amount={amount}
            cashinId={cashinId}
            playerUsername={playerUsername}
            setEnableChatBased={setEnableChatBased}
            casinoLink={casinoLink}
          />
        </CardContent>
      )}
    </Card>
  );
}

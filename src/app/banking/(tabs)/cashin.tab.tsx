"use client";

import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PAYMENT_METHODS, QUICK_AMOUNTS } from "@/lib/constants/data";
import { PaymentMethod } from "../page";

interface CashInContentProps {
  selectedPayment: PaymentMethod | null;
  setSelectedPayment: (method: PaymentMethod) => void;
  amount: string;
  setAmount: (amount: string) => void;
  handleProceedToQR: () => void;
}

export function CashInContent({
  selectedPayment,
  setSelectedPayment,
  amount,
  setAmount,
  handleProceedToQR,
}: CashInContentProps) {
  return (
    <Card>
      <CardContent className="pt-4 sm:pt-6 space-y-4 sm:space-y-6">
        {/* Step 1: Payment Method Selection */}
        <div>
          <Label className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 block">
            Step 1. Select Payment Method
          </Label>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
            {PAYMENT_METHODS.map((method) => (
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
          </div>
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleProceedToQR}
          className="w-full h-12 sm:h-14 text-base sm:text-lg bg-primary hover:bg-primary/90"
        >
          Proceed to Payment
        </Button>
      </CardContent>
    </Card>
  );
}

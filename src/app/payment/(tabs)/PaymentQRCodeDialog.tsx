"use client";

import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { PaymentMethod } from "@/app/banking/page";
import { useCallback, useState } from "react";
import { toast } from "sonner";

interface PaymentQRCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeTab: "cashin" | "cashout" | "history" | string;
  amount: string;
  selectedPayment: PaymentMethod;
  username: string;
  externalUserId: string;

  displayBankName?: string;
  accountName: string;
  accountNumber: string;
  casino: string;
  balance: string;
  selectedBank?: string;
  customBank: string;
  setActiveTab: (tab: "cashin" | "cashout" | "history" | string) => void;
}

export function PaymentQRCodeDialog({
  open,
  onOpenChange,
  activeTab,
  username,
  externalUserId,
  amount,
  selectedPayment,
  displayBankName,
  accountName,
  accountNumber,
  casino,
  balance,
  selectedBank,
  customBank,
  setActiveTab,
}: PaymentQRCodeDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const handleFinalSubmit = useCallback(async () => {
    const minAmount = 100;
    if (parseFloat(amount) < minAmount) {
      toast.error(`Cashout minimum amount is ${minAmount}`);
      return;
    }

    setIsSubmitting(true);
    if (Number(amount) >= Number(balance)) {
      return toast.error(
        `Insufficient Balance. You only have ${Number(balance)}`,
      );
    }

    try {
      const payload = {
        Channel: selectedPayment,
        Amount: parseFloat(amount),
        ReferenceUserId: externalUserId,
        UserName: username,
        NotificationUrl:
          "https://www.project-manager-three-kappa.vercel.app/api/dpay/receive-payment-callback",
        SuccessRedirectUrl:
          "http://project-manager-three-kappa.vercel.app/payment/success",
        CancelRedirectUrl: "https://qbet88.vip/",
        Type: "CASHOUT",
        AccountName: accountName,
        AccountNumber: accountNumber,
        HolderName: accountName,
        Bank: selectedBank === "Other" ? customBank.trim() : selectedBank,
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
        throw new Error(data.error || "Failed to store transaction");
      }

      setShowSuccessMessage(true);

      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 5000);
      setActiveTab("history");
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to submit transaction");
    } finally {
      setIsSubmitting(false);
    }
  }, [
    amount,
    username,
    externalUserId,
    selectedPayment,
    setActiveTab,
    onOpenChange,
    balance,
    selectedBank,
    customBank,
    accountName,
    accountNumber,
  ]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg overflow-y-auto max-h-[95vh] dark">
        {!showSuccessMessage ? (
          <>
            <DialogHeader>
              <DialogTitle>Complete Your Payment</DialogTitle>
              <DialogDescription className="flex flex-row gap-1">
                <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 " />
                Please follow the instructions below to complete your
                transaction
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Cash Out Summary */}
              {activeTab === "cashout" && (
                <>
                  <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                    <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <AlertDescription className="text-sm text-blue-900 dark:text-blue-100 ml-2">
                      Please review your cash-out details carefully before
                      submitting. Our team will process your request shortly.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-3 p-4 bg-muted rounded-lg border">
                    <h4 className="font-semibold text-sm text-white">
                      Transaction Summary
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Amount:</span>
                        <span className="font-semibold dark:text-white">
                          ₱{amount}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Payment Method:
                        </span>
                        <span className="font-semibold dark:text-white">
                          {selectedPayment}
                        </span>
                      </div>
                      <div className="pt-2 border-t">
                        <p className="text-xs font-semibold text-muted-foreground mb-2">
                          Bank Account Details:
                        </p>
                        <div className="text-xs text-foreground bg-background p-3 rounded-md space-y-1">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Bank:</span>
                            <span className="font-medium">
                              {displayBankName}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Account Name:
                            </span>
                            <span className="font-medium">{accountName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Account Number:
                            </span>
                            <span className="font-medium font-mono">
                              {accountNumber}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Submit Button */}
              <Button
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="w-full h-11"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing Request...
                  </>
                ) : activeTab === "cashin" ? (
                  "Upload Receipt"
                ) : (
                  "Submit Cash Out Request"
                )}
              </Button>
            </div>
          </>
        ) : (
          <div className="py-8 text-center space-y-4">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
            <DialogHeader>
              <DialogTitle className="text-xl">
                Request Submitted Successfully!
              </DialogTitle>
              <DialogDescription className="text-base">
                Thank you for your patience. Our team is reviewing your request
                and will process it shortly. Your account will be credited once
                verified.
              </DialogDescription>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              This window will close automatically...
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

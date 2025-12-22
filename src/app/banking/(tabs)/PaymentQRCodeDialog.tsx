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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, AlertCircle, X, CheckCircle2, Loader2 } from "lucide-react";
import { PaymentMethod } from "../page";

interface PaymentQRCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  activeTab: "cashin" | "cashout" | "history" | string;
  amount: string | number;
  selectedPayment: PaymentMethod;
  QR_CODE_MAP?: Record<string, string>;

  displayBankName?: string;
  accountName?: string;
  accountNumber?: string;

  receiptPreview: string | null;
  receiptFile?: File | null;
  handleReceiptChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeReceipt?: () => void;

  isSubmitting: boolean;
  handleFinalSubmit: () => void;

  showSuccessMessage?: boolean;
}

export function PaymentQRCodeDialog({
  open,
  onOpenChange,
  activeTab,
  amount,
  selectedPayment,
  QR_CODE_MAP,
  displayBankName,
  accountName,
  accountNumber,
  receiptPreview,
  receiptFile,
  handleReceiptChange,
  removeReceipt,
  isSubmitting,
  handleFinalSubmit,
  showSuccessMessage,
}: PaymentQRCodeDialogProps) {
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
              {/* Instructions Alert for Cash In */}
              {activeTab === "cashin" && (
                <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                  <AlertDescription className="text-sm text-blue-900 dark:text-blue-100">
                    <ol className="list-none space-y-2">
                      <li className="flex gap-2">
                        <span className="font-semibold shrink-0">Step 1:</span>
                        <span>Save or screenshot the QR code below</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="font-semibold shrink-0">Step 2:</span>
                        <span>
                          Upload QR to your GCash, Maya or Other Banks and send
                          ₱{amount}
                        </span>
                      </li>
                      <li className="flex gap-2">
                        <span className="font-semibold shrink-0">Step 3:</span>
                        <span>
                          Take a screenshot of your payment confirmation
                        </span>
                      </li>
                      <li className="flex gap-2">
                        <span className="font-semibold shrink-0">Step 4:</span>
                        <span>Upload the receipt screenshot below</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="font-semibold shrink-0">Step 5:</span>
                        <span>
                          Go back to your dashboard or transaction history to
                          verify your payment. Good luck!
                        </span>
                      </li>
                    </ol>
                  </AlertDescription>
                </Alert>
              )}

              {/* QR Code Display */}
              {activeTab === "cashin" && selectedPayment && QR_CODE_MAP && (
                <div className="flex flex-col items-center space-y-3">
                  <div className="text-center">
                    <p className="text-sm font-semibold text-foreground">
                      {selectedPayment} Payment QR Code
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Scan or screenshot this code to make payment
                    </p>
                  </div>
                  <div className="relative w-64 h-64 bg-muted rounded-lg flex items-center justify-center border-2 border-border">
                    <Image
                      src={QR_CODE_MAP[selectedPayment]}
                      alt={`${selectedPayment} QR Code`}
                      fill
                      className="object-contain p-4 rounded-lg"
                    />
                  </div>
                  <div className="bg-primary/10 px-4 py-2 rounded-md">
                    <p className="text-sm text-foreground">
                      Amount to Send:{" "}
                      <span className="font-bold text-lg">₱{amount}</span>
                    </p>
                  </div>
                </div>
              )}

              {/* Receipt Upload */}
              {activeTab === "cashin" && (
                <div className="space-y-2">
                  <Label
                    htmlFor="receipt-upload"
                    className="text-sm font-semibold"
                  >
                    Upload Payment Receipt
                  </Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Please upload a clear screenshot of your payment
                    confirmation
                  </p>

                  {!receiptPreview ? (
                    <Label htmlFor="receipt-upload" className="cursor-pointer">
                      <div className="w-full border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center hover:border-primary/50 hover:bg-primary/5 transition-colors">
                        <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-xs text-muted-foreground">
                          PNG, JPG up to 5MB
                        </p>
                      </div>
                      <Input
                        id="receipt-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleReceiptChange}
                      />
                    </Label>
                  ) : (
                    <div className="relative">
                      <div className="relative w-full h-48 bg-muted rounded-lg border-2 border-green-500">
                        <Image
                          src={receiptPreview}
                          alt="Receipt preview"
                          fill
                          className="object-contain rounded-lg"
                        />
                      </div>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={removeReceipt}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <p className="text-xs text-green-600 dark:text-green-400 mt-2 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Receipt uploaded
                        successfully
                      </p>
                    </div>
                  )}
                </div>
              )}

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
                disabled={
                  isSubmitting || (activeTab === "cashin" && !receiptFile)
                }
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

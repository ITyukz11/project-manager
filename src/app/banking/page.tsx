"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Upload, X, CheckCircle2, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Image from "next/image";
import { Alert, AlertDescription } from "@/components/ui/alert";

type PaymentMethod = "QRPH" | null;

export default function BankingPage() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("cashin");
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>(null);
  const [amount, setAmount] = useState("");
  const [username, setUsername] = useState("");
  const [casino, setCasinoGroup] = useState("");
  const [bankDetails, setBankDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dialog states
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Get username and casino group from URL parameters
  useEffect(() => {
    const usernameParam = searchParams.get("username");
    const casinoGroupParam = searchParams.get("casino");

    if (usernameParam) {
      setUsername(usernameParam);
    }

    if (casinoGroupParam) {
      setCasinoGroup(casinoGroupParam);
    }
  }, [searchParams]);

  const paymentMethods = [
    { id: "QRPH", name: "QRPH", icon: "/allbanks.png" },
    { id: "GoTyme", name: "GoTyme", icon: "/gotyme.png" },
  ];

  const quickAmounts = [100, 150, 200, 300, 500, 1000];

  // QR code mapping based on payment method
  const qrCodeMap: Record<string, string> = {
    QRPH: "/Sec-QRPH-qr.png",
    GoTyme: "/gotyme-qr.png",
  };

  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }

      setReceiptFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeReceipt = () => {
    setReceiptFile(null);
    setReceiptPreview(null);
  };

  const handleProceedToQR = () => {
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

    if (activeTab === "cashout" && !bankDetails.trim()) {
      toast.error("Please enter bank details for cash out");
      return;
    }

    // Open QR dialog
    setShowQRDialog(true);
  };

  const handleFinalSubmit = async () => {
    if (activeTab === "cashin" && !receiptFile) {
      toast.error("Please upload payment receipt");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("type", activeTab === "cashin" ? "CASHIN" : "CASHOUT");
      formData.append("username", username.trim());
      formData.append("amount", amount);
      formData.append("paymentMethod", selectedPayment || "");
      formData.append("casinoGroupName", casino);

      if (activeTab === "cashout") {
        formData.append("bankDetails", bankDetails.trim());
      }

      if (receiptFile) {
        formData.append("receipt", receiptFile);
      }

      const response = await fetch("/api/transaction-request", {
        method: "POST",
        headers: {
          // ✅ ADD API KEY HERE
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_BANKING_API_KEY}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit transaction");
      }

      // Show success message
      setShowSuccessMessage(true);

      // Reset form after 5 seconds
      setTimeout(() => {
        setShowQRDialog(false);
        setShowSuccessMessage(false);
        setAmount("");
        setBankDetails("");
        setSelectedPayment(null);
        setReceiptFile(null);
        setReceiptPreview(null);
      }, 5000);
    } catch (error: any) {
      toast.error(error.message || "Failed to submit transaction");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show error if required parameters are missing
  if (!username || !casino) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 w-xl justify-self-center">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <p className="font-semibold mb-2">Missing Required Parameters</p>
            <p className="text-sm">
              Please access this page with username and casino parameters.
            </p>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F1F1F1] dark:bg-primary/10">
      <div className="container mx-auto p-4 sm:p-6 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Transaction Request
          </h1>
          <div className="text-sm text-muted-foreground mt-1 space-y-0. 5">
            <p>
              Player: <span className="font-semibold">{username}</span>
            </p>
            <p>
              Casino: <span className="font-semibold">{casino}</span>
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-primary/10">
            <TabsTrigger
              value="cashin"
              className="data-[state=active]:bg-background data-[state=active]:text-foreground"
            >
              Cash in
            </TabsTrigger>
            <TabsTrigger
              value="cashout"
              className="data-[state=active]:bg-background data-[state=active]:text-foreground"
            >
              Cash out
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="data-[state=active]:bg-background data-[state=active]:text-foreground"
            >
              History
            </TabsTrigger>
          </TabsList>

          {/* CASH IN TAB */}
          <TabsContent value="cashin">
            <Card>
              <CardContent className="pt-4 sm:pt-6 space-y-4 sm:space-y-6">
                {/* Step 1: Payment Method Selection */}
                <div>
                  <Label className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 block">
                    Step 1. Select Payment Method
                  </Label>
                  <div className="grid grid-cols-3 gap-2 sm:gap-4">
                    {paymentMethods.map((method) => (
                      <Card
                        key={method.id}
                        className={`cursor-pointer transition-all hover:shadow-lg ${
                          selectedPayment === method.id
                            ? "ring-2 ring-primary shadow-lg"
                            : ""
                        }`}
                        onClick={() =>
                          setSelectedPayment(method.id as PaymentMethod)
                        }
                      >
                        <CardContent className="sm:p-0 flex flex-col items-center justify-center ">
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
                      {quickAmounts.map((amt) => (
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
          </TabsContent>

          {/* CASH OUT TAB */}
          <TabsContent value="cashout">
            <Card>
              <CardContent className="pt-4 sm:pt-6 space-y-4 sm:space-y-6">
                {/* Step 1: Payment Method Selection */}
                <div>
                  <Label className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 block">
                    Step 1. Select Payment Method
                  </Label>
                  <div className="grid grid-cols-3 gap-2 sm:gap-4">
                    {paymentMethods.map((method) => (
                      <Card
                        key={method.id}
                        className={`cursor-pointer transition-all hover:shadow-lg ${
                          selectedPayment === method.id
                            ? "ring-2 ring-primary shadow-lg"
                            : ""
                        }`}
                        onClick={() =>
                          setSelectedPayment(method.id as PaymentMethod)
                        }
                      >
                        <CardContent className="p-0 flex flex-col items-center justify-center ">
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

                {/* Step 2: Amount and Bank Details */}
                <div>
                  <Label className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 block">
                    Step 2. Enter Amount & Bank Details
                  </Label>
                  <div className="space-y-3 sm:space-y-4">
                    {/* Amount Input */}
                    <div>
                      <Label
                        htmlFor="cashout-amount"
                        className="text-sm mb-2 block"
                      >
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

                    {/* Quick Amount Buttons */}
                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                      {quickAmounts.map((amt) => (
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

                    {/* Bank Details */}
                    <div>
                      <Label
                        htmlFor="bank-details"
                        className="text-sm mb-2 block"
                      >
                        Bank Details
                      </Label>
                      <Textarea
                        id="bank-details"
                        placeholder="Enter bank name, account number, account name..."
                        value={bankDetails}
                        onChange={(e) => setBankDetails(e.target.value)}
                        className="min-h-[100px] sm:min-h-[120px]"
                        rows={4}
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  onClick={handleProceedToQR}
                  className="w-full h-12 sm:h-14 text-base sm:text-lg bg-primary hover:bg-primary/90"
                >
                  Submit Cash Out Request
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* HISTORY TAB */}
          <TabsContent value="history">
            <Card>
              <CardContent className="pt-8 pb-8 sm:pt-12 sm:pb-12">
                <div className="text-center">
                  <p className="text-muted-foreground text-sm sm:text-base">
                    Transaction history will be displayed here
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* QR Code & Receipt Upload Dialog */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="max-w-md overflow-y-auto max-h-[95vh]">
          {!showSuccessMessage ? (
            <>
              <DialogHeader>
                <DialogTitle>Complete Your Payment</DialogTitle>
                <DialogDescription>
                  Please follow the instructions below to complete your
                  transaction
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Instructions Alert */}
                {activeTab === "cashin" && (
                  <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                    <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <AlertDescription className="text-sm text-blue-900 dark:text-blue-100 ml-2">
                      <ol className="list-decimal list-inside space-y-1">
                        <li>Save or screenshot the QR code below</li>
                        <li>
                          Open your {selectedPayment} app and send ₱{amount}
                        </li>
                        <li>Take a screenshot of your payment confirmation</li>
                        <li>Upload the receipt screenshot below</li>
                      </ol>
                    </AlertDescription>
                  </Alert>
                )}

                {/* QR Code Display */}
                {activeTab === "cashin" && selectedPayment && (
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
                        src={qrCodeMap[selectedPayment]}
                        alt={`${selectedPayment} QR Code`}
                        fill
                        className="object-contain p-4"
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
                      <Label
                        htmlFor="receipt-upload"
                        className="cursor-pointer"
                      >
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
                          <CheckCircle2 className="h-3 w-3" />
                          Receipt uploaded successfully
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
                      <h4 className="font-semibold text-sm">
                        Transaction Summary
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Amount:</span>
                          <span className="font-semibold">₱{amount}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Payment Method:
                          </span>
                          <span className="font-semibold">
                            {selectedPayment}
                          </span>
                        </div>
                        <div className="pt-2 border-t">
                          <p className="text-xs font-semibold text-muted-foreground mb-1">
                            Bank Account Details:
                          </p>
                          <p className="text-xs text-foreground whitespace-pre-wrap bg-background p-2 rounded">
                            {bankDetails}
                          </p>
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
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing Request...
                    </>
                  ) : (
                    <>
                      {activeTab === "cashin"
                        ? "Upload Receipt"
                        : "Submit Cash Out Request"}
                    </>
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
                  Thank you for your patience. Our team is reviewing your
                  request and will process it shortly. Your account will be
                  credited once verified.
                </DialogDescription>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">
                This window will close automatically...
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

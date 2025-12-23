"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { CashInContent } from "./(tabs)/cashin.tab";

import { CashOutContent } from "./(tabs)/cashout.tab";
import { TransactionHistoryContent } from "./(tabs)/history.tab";
import { PaymentQRCodeDialog } from "./(tabs)/PaymentQRCodeDialog";
import { usePusher } from "@/lib/hooks/use-pusher";

export type PaymentMethod = "QRPH" | "GoTyme" | "Chat-Based" | null;

const QR_CODE_MAP: Record<string, string> = {
  QRPH: "/Sec-QRPH-qr.png",
  GoTyme: "/gotyme-qr1.png",
};

// Transaction type
export type Transaction = {
  id: string;
  type: string;
  amount: number;
  status: string;
  paymentMethod: string | null;
  bankDetails: string | null;
  receiptUrl: string | null;
  casinoGroup: string;
  processedBy: {
    name: string;
    username: string;
  } | null;
  createdAt: string;
  updatedAt: string;
  remarks: string | null;
};

export default function BankingPage() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<
    "cashin" | "cashout" | "history" | string
  >("cashin");
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>(null);
  const [amount, setAmount] = useState("");

  //params
  const [username, setUsername] = useState("");
  const [casino, setCasinoGroup] = useState("");
  const [balance, setBalance] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dialog states
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Updated:  Individual bank detail fields
  const [selectedBank, setSelectedBank] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");

  // History tab states
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const [customBank, setCustomBank] = useState("");

  // Chat-Based payment state
  const [enableChatBased, setEnableChatBased] = useState(false);
  const [chatBasedLoading, setChatBasedLoading] = useState(false);
  const [cashinId, setCashinId] = useState<string | null>(null);

  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);
  const COOLDOWN_SECONDS = 10;

  console.log("balance: ", balance);
  // Get username and casino group from URL parameters
  useEffect(() => {
    const usernameParam = searchParams.get("username");
    const casinoGroupParam = searchParams.get("casino");
    const balanceParam = searchParams.get("balance");
    if (usernameParam) {
      setUsername(usernameParam);
    }

    if (casinoGroupParam) {
      setCasinoGroup(casinoGroupParam);
    }

    if (balanceParam) {
      setBalance(balanceParam);
    }
  }, [searchParams]);

  const fetchTransactionHistory = useCallback(async () => {
    const now = Date.now();
    const timeSinceLastFetch = (now - lastFetchTime) / 1000; // Convert to seconds

    // ✅ Check if still in cooldown
    if (timeSinceLastFetch < COOLDOWN_SECONDS) {
      const remaining = Math.ceil(COOLDOWN_SECONDS - timeSinceLastFetch);
      setCooldownRemaining(remaining);
      return;
    }

    setIsLoadingHistory(true);
    setHistoryError(null);
    setCooldownRemaining(0);

    try {
      const response = await fetch(
        `/api/transaction-request/username/${username}?casinoGroup=${casino}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_BANKING_API_KEY}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch transaction history");
      }

      setTransactions(data.transactions || []);
      setLastFetchTime(Date.now()); // ✅ Update last fetch time on success
    } catch (error: any) {
      console.error("Error fetching history:", error);
      setHistoryError(error.message || "Failed to load transaction history");
      toast.error("Failed to load transaction history");
    } finally {
      setIsLoadingHistory(false);
    }
  }, [username, casino, lastFetchTime]);

  useEffect(() => {
    if (activeTab === "history") {
      fetchTransactionHistory();
    }
    setSelectedPayment(null);
  }, [activeTab, fetchTransactionHistory]);

  // ✅ Optional:  Countdown timer for UI feedback
  useEffect(() => {
    if (cooldownRemaining > 0) {
      const timer = setTimeout(() => {
        setCooldownRemaining((prev) => Math.max(0, prev - 1));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldownRemaining]);

  const handleReceiptChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        if (!file.type.startsWith("image/")) {
          toast.error("Please upload an image file");
          return;
        }

        if (file.size > 5 * 1024 * 1024) {
          toast.error("File size must be less than 5MB");
          return;
        }

        setReceiptFile(file);

        const reader = new FileReader();
        reader.onloadend = () => {
          setReceiptPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    },
    []
  );

  const removeReceipt = useCallback(() => {
    setReceiptFile(null);
    setReceiptPreview(null);
  }, []);

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

    if (selectedPayment === "Chat-Based") {
      setChatBasedLoading(true);

      const toastId = toast.loading("Connecting to chat-based cashin...");

      const formData = new FormData();
      formData.append("type", activeTab === "cashin" ? "CASHIN" : "CASHOUT");
      formData.append("username", username.trim());
      formData.append("amount", amount);
      formData.append("balance", balance);
      formData.append("paymentMethod", selectedPayment || "");
      formData.append("casinoGroupName", casino);
      formData.append("enableChatBased", enableChatBased ? "true" : "false");

      try {
        const response = await fetch("/api/transaction-request/chat-based", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_BANKING_API_KEY}`,
          },
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to submit transaction");
        }

        console.log("Chat-Based cashin created:", data);
        // Success toast
        toast.success("Successfully created chat-based channel", {
          id: toastId,
        });
        setEnableChatBased(true);
        setShowSuccessMessage(true);
        setCashinId(data.transaction.cashinId);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Unknown error occurred";

        toast.error("Failed to connect Chat-Based payment: " + message, {
          id: toastId,
        });
      } finally {
        setChatBasedLoading(false);
      }

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

    if (activeTab === "cashout") {
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
    }

    setShowQRDialog(true);
  }, [
    username,
    casino,
    selectedPayment,
    amount,
    activeTab,
    selectedBank,
    customBank,
    accountName,
    accountNumber,
    balance,
    enableChatBased,
    setEnableChatBased,
  ]);

  const handleFinalSubmit = useCallback(async () => {
    const minAmount = 100;
    if (parseFloat(amount) < minAmount) {
      toast.error(`Minimum amount is ${minAmount}`);
      return;
    }

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
        if (Number(amount) >= Number(balance)) {
          return toast.error(
            `Insufficient Balance. You only have ${Number(balance)}`
          );
        }
        const bankName =
          selectedBank === "Other" ? customBank.trim() : selectedBank;
        const bankDetailsFormatted = `Bank: ${bankName}\nAccount Name: ${accountName.trim()}\nAccount Number: ${accountNumber.trim()}`;
        formData.append("bankDetails", bankDetailsFormatted);
      }

      if (receiptFile) {
        formData.append("receipt", receiptFile);
      }

      const response = await fetch("/api/transaction-request", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_BANKING_API_KEY}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit transaction");
      }

      setShowSuccessMessage(true);

      setTimeout(() => {
        setShowQRDialog(false);
        setShowSuccessMessage(false);
        setAmount("");
        setSelectedBank("");
        setCustomBank("");
        setAccountName("");
        setAccountNumber("");
        setSelectedPayment(null);
        setReceiptFile(null);
        setReceiptPreview(null);
        setActiveTab("history");
      }, 5000);
    } catch (error: any) {
      toast.error(error.message || "Failed to submit transaction");
    } finally {
      setIsSubmitting(false);
    }
  }, [
    amount,
    activeTab,
    receiptFile,
    username,
    selectedPayment,
    casino,
    balance,
    selectedBank,
    customBank,
    accountName,
    accountNumber,
  ]);

  // Memoize the bank display name
  const displayBankName = useMemo(() => {
    return selectedBank === "Other" ? customBank : selectedBank;
  }, [selectedBank, customBank]);

  // Show error if required parameters are missing
  if (!username || !casino || !balance) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 w-xl justify-self-center">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <p className="font-semibold mb-2">Missing Required Parameters</p>
            <p className="text-sm">
              Please access this page with username, casino, and balance
              parameters.
            </p>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="dark relative min-h-screen bg-[url('/qbet-bg.jpg')] bg-cover bg-center bg-no-repeat bg-fixed">
      <div className="container mx-auto p-4 sm:p-6 max-w-4xl">
        <div className="mb-2">
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
            <p>
              Balance: <span className="font-semibold">{balance}</span>
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger
              value="cashin"
              className="data-[state=active]:bg-white data-[state=active]:text-black"
            >
              Cash in
            </TabsTrigger>
            <TabsTrigger
              value="cashout"
              className="data-[state=active]:bg-white data-[state=active]:text-black"
            >
              Cash out
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="data-[state=active]:bg-white data-[state=active]:text-black"
              onClick={fetchTransactionHistory}
            >
              History
            </TabsTrigger>
          </TabsList>

          {/* CASH IN TAB */}
          <TabsContent value="cashin">
            <CashInContent
              selectedPayment={selectedPayment}
              setSelectedPayment={setSelectedPayment}
              amount={amount}
              setAmount={setAmount}
              handleProceedToQR={handleProceedToQR}
              enableChatBased={enableChatBased}
              chatBasedLoading={chatBasedLoading}
              setEnableChatBased={setEnableChatBased}
              cashinId={cashinId}
              playerUsername={username}
              casinoLink={casino}
            />
          </TabsContent>

          {/* CASH OUT TAB */}
          <TabsContent value="cashout">
            <CashOutContent
              selectedPayment={selectedPayment}
              setSelectedPayment={setSelectedPayment}
              amount={amount}
              setAmount={setAmount}
              selectedBank={selectedBank}
              setSelectedBank={setSelectedBank}
              customBank={customBank}
              setCustomBank={setCustomBank}
              accountName={accountName}
              setAccountName={setAccountName}
              accountNumber={accountNumber}
              setAccountNumber={setAccountNumber}
              handleProceedToQR={handleProceedToQR}
            />
          </TabsContent>

          {/* HISTORY TAB - UPDATED */}
          <TabsContent value="history">
            <TabsContent value="history">
              <TransactionHistoryContent
                transactions={transactions}
                isLoadingHistory={isLoadingHistory}
                historyError={historyError}
                cooldownRemaining={cooldownRemaining}
                casinoLink={casino}
                fetchTransactionHistory={fetchTransactionHistory}
              />
            </TabsContent>
          </TabsContent>
        </Tabs>
      </div>

      {/* QR Code & Receipt Upload Dialog */}
      <PaymentQRCodeDialog
        open={showQRDialog}
        onOpenChange={setShowQRDialog}
        activeTab={activeTab}
        amount={amount}
        selectedPayment={selectedPayment}
        QR_CODE_MAP={QR_CODE_MAP}
        displayBankName={displayBankName}
        accountName={accountName}
        accountNumber={accountNumber}
        receiptPreview={receiptPreview}
        receiptFile={receiptFile}
        handleReceiptChange={handleReceiptChange}
        removeReceipt={removeReceipt}
        isSubmitting={isSubmitting}
        handleFinalSubmit={handleFinalSubmit}
        showSuccessMessage={showSuccessMessage}
      />
    </div>
  );
}

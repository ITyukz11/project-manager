"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { AlertCircle, RefreshCw } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { CashInContent } from "./(tabs)/cashin.tab";

import { CashOutContent } from "./(tabs)/cashout.tab";
import { TransactionHistoryContent } from "./(tabs)/history.tab";
import { PaymentQRCodeDialog } from "./(tabs)/PaymentQRCodeDialog";
import Loading from "./Loading";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";
import { useBalance } from "@/lib/hooks/swr/qbet88/useBalance";
import { Spinner } from "@/components/ui/spinner";
import { formatAmountWithDecimals } from "@/components/formatAmount";

export type PaymentMethod =
  | "QRPH-RAN"
  | "QRPH"
  | "GCash/Maya"
  | "GoTyme"
  | "Bank"
  | "Chat-Based"
  | null;

export const QR_CODE_MAP: Record<string, string> = {
  QRPH: "/Sec-QRPH-qr.png",
  "QRPH-RAN": "/payment-gateway/QR-Ran.png",
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

  const [pageLoading, setPageLoading] = useState(true);
  //params
  const [username, setUsername] = useState("");
  const [externalUserId, setExternalUserId] = useState("");
  const [casino, setCasinoGroup] = useState("");

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

  const [casinoExists, setCasinoExists] = useState<boolean | null>(null);

  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);
  const COOLDOWN_SECONDS = 10;

  const [referrer, setReferrer] = useState("");

  const {
    balance,
    isLoading: balanceLoading,
    refreshBalance,
    isValidating: balanceValidating,
    error: balanceError,
  } = useBalance(
    casino.toLocaleLowerCase() !== "ran" ? externalUserId : undefined,
  );

  console.log("balance: ", balance);

  // Get username and casino group from URL parameters
  // 1. Extract params FROM URL
  useEffect(() => {
    const usernameParam = searchParams.get("username");
    const externalUserIdParam = searchParams.get("id");
    const casinoGroupParam = searchParams.get("casino");

    if (usernameParam) setUsername(usernameParam);
    if (externalUserIdParam) setExternalUserId(externalUserIdParam);
    if (casinoGroupParam) setCasinoGroup(casinoGroupParam);
  }, [searchParams]);
  console.log("casino: ", casino);
  // 2. Check casino existence (triggered by casino name change)
  useEffect(() => {
    if (!casino) return;

    const checkCasino = async () => {
      try {
        const res = await fetch(`/api/casino-group/${casino}/exists/`);

        if (!res.ok) throw new Error("Server error");

        const data = await res.json();
        setCasinoExists(data.exists);
      } catch (err) {
        setCasinoExists(false);
      }
    };

    checkCasino();
  }, [casino]);

  useEffect(() => {
    if (!username || !externalUserId || !casino || casinoExists !== true)
      return;

    const checkExistingCashin = async () => {
      try {
        const res = await fetch(
          `/api/cashin/${username}/accommodating?casino=${casino}`,
        );

        if (!res.ok) return;

        const data = await res.json();
        console.log("Existing accommodating cashin check:", data);
        console.log("Data exists:", username, casino);
        if (data.exists) {
          setEnableChatBased(true);
          setCashinId(data.cashinId);
        }
      } catch (err) {
        console.error("Failed to check existing cashin", err);
      } finally {
        await signOut({ redirect: false });
        setPageLoading(false);
      }
    };

    checkExistingCashin();
  }, [username, casino, casinoExists, externalUserId]);

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
        },
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
    setShowSuccessMessage(false);
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
    [],
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
      formData.append("externalUserId", externalUserId);
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

    const minAmount = casino.toLowerCase() === "ran" ? 50 : 100;
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
    externalUserId,
    balance,
    enableChatBased,
    selectedBank,
    customBank,
    accountName,
    accountNumber,
  ]);

  const handleFinalSubmit = useCallback(async () => {
    const minAmount = casino.toLowerCase() === "ran" ? 50 : 100;
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
      formData.append("externalUserId", externalUserId);
      formData.append("amount", amount);
      formData.append("paymentMethod", selectedPayment || "");
      formData.append("casinoGroupName", casino);

      if (activeTab === "cashout") {
        if (Number(amount) >= Number(balance)) {
          return toast.error(
            `Insufficient Balance. You only have ${Number(balance)}`,
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

      //for ran online
      if (referrer) {
        formData.append("referrer", referrer.trim());
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
    externalUserId,
    selectedPayment,
    casino,
    balance,
    selectedBank,
    customBank,
    accountName,
    accountNumber,
    referrer,
  ]);

  // Memoize the bank display name
  const displayBankName = useMemo(() => {
    return selectedBank === "Other" ? customBank : selectedBank;
  }, [selectedBank, customBank]);

  // Show error if required parameters are missing
  if (pageLoading) {
    return <Loading />;
  }

  if (!casinoExists) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] space-y-6">
        {/* Icon -- you can swap for another SVG or library icon */}
        <svg width="60" height="60" fill="none" className="text-red-500">
          <circle
            cx="30"
            cy="30"
            r="28"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            d="M20 20l20 20M40 20l-20 20"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </svg>
        <div className="text-xl font-bold text-gray-400">
          Casino Group Not Found
        </div>
        <div className="text-gray-500">
          {casino ? (
            <>
              We couldn&apos;t find a casino group named{" "}
              <span className="font-bold text-white">{casino}</span>.
            </>
          ) : (
            "The casino group you're looking for doesn't exist or has been removed."
          )}
        </div>
        <Button onClick={() => window.history.back()} variant="outline">
          Go Back
        </Button>
      </div>
    );
  }

  if (!username || !casino || !balance) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
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
  console.log("activeTab: ", activeTab);
  return (
    <div className="dark relative min-h-screen bg-[url('/qbet-bg.jpg')] bg-cover bg-center bg-no-repeat bg-fixed">
      <div className="container mx-auto p-4 sm:p-6 max-w-4xl min-h-dvh flex flex-col">
        <div className="flex flex-row justify-between mb-2 items-center">
          <h1 className="text-xl sm:text-3xl font-bold text-foreground flex flex-row gap-2">
            Transaction <span className="hidden sm:block">Request</span>
          </h1>
          {casino.toLocaleLowerCase() !== "ran" && (
            <div className="flex flex-row text-muted-foreground items-center gap-1">
              Balance: {formatAmountWithDecimals(balance)}
              <button
                type="button"
                onClick={() => refreshBalance()}
                disabled={balanceLoading}
                title="Refresh balance"
                className="cursor-pointer flex items-center justify-center "
              >
                {!balanceLoading && !balanceValidating ? (
                  <RefreshCw className="w-3.5 h-3.5" />
                ) : (
                  <Spinner />
                )}
              </button>
            </div>
          )}
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full h-full"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger
              value="cashin"
              className="data-[state=active]:bg-white data-[state=active]:text-black"
            >
              Cash in
            </TabsTrigger>
            {casino.toLocaleLowerCase() !== "ran" && (
              <TabsTrigger
                value="cashout"
                disabled={enableChatBased}
                className="data-[state=active]:bg-white data-[state=active]:text-black"
              >
                Cash out
              </TabsTrigger>
            )}

            <TabsTrigger
              value="history"
              disabled={enableChatBased}
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
              referrer={referrer}
              setReferrer={setReferrer}
            />
          </TabsContent>

          {/* CASH OUT TAB */}
          {casino.toLocaleLowerCase() !== "ran" && (
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
          )}
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
                casinoName={casino}
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

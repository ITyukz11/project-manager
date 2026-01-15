"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, RefreshCw } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { CashInContent } from "./(tabs)/cashin/cashin.tab";

import { CashOutContent } from "./(tabs)/cashout.tab";
import { Button } from "@/components/ui/button";
import { useBalance } from "@/lib/hooks/swr/qbet88/useBalance";
import { Spinner } from "@/components/ui/spinner";
import { formatAmountWithDecimals } from "@/components/formatAmount";
import { TransactionHistoryContent } from "./(tabs)/history.tab";

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

  //params
  const [username, setUsername] = useState("");
  const [externalUserId, setExternalUserId] = useState("");
  const [casino, setCasinoGroup] = useState("");

  const [casinoExists, setCasinoExists] = useState<boolean | null>(null);
  const [casinoExistsLoading, setCasinoExistsLoading] = useState(true);

  const {
    balance,
    isLoading: balanceLoading,
    refreshBalance,
    isValidating: balanceValidating,
    error: balanceError,
  } = useBalance(externalUserId);

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

  // 2. Check casino existence (triggered by casino name change)
  useEffect(() => {
    if (!casino) return;

    const checkCasino = async () => {
      setCasinoExistsLoading(true);
      try {
        const res = await fetch(`/api/casino-group/${casino}/exists/`);

        if (!res.ok) throw new Error("Server error");

        const data = await res.json();
        setCasinoExists(data.exists);
        setCasinoExistsLoading(false);
      } catch (err) {
        setCasinoExists(false);
      }
    };

    checkCasino();
  }, [casino]);

  if (!casinoExists && !casinoExistsLoading) {
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

  if ((!username || !casino || !balance) && !casinoExistsLoading) {
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
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Transaction Request
          </h1>
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
            <TabsTrigger
              value="cashout"
              className="data-[state=active]:bg-white data-[state=active]:text-black"
            >
              Cash out
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="data-[state=active]:bg-white data-[state=active]:text-black"
            >
              History
            </TabsTrigger>
          </TabsList>

          {/* CASH IN TAB */}
          <TabsContent value="cashin">
            <CashInContent
              externalUserId={externalUserId}
              userName={username}
            />
          </TabsContent>

          {/* CASH OUT TAB */}
          <TabsContent value="cashout">
            <CashOutContent
              externalUserId={externalUserId}
              username={username}
              balance={balance}
              casino={casino}
              setActiveTab={setActiveTab}
            />
          </TabsContent>

          {/* HISTORY TAB - UPDATED */}
          <TabsContent value="history">
            <TabsContent value="history">
              <TransactionHistoryContent
                casinoName={casino}
                externalUserId={externalUserId}
              />
            </TabsContent>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

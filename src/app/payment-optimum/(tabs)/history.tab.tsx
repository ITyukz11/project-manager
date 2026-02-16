"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

import { Loader2, RefreshCw, AlertCircle, MoveUpLeft } from "lucide-react";
import {
  getStatusColorClass,
  getStatusIcon,
} from "@/components/getStatusColorClass";
import { ReceiptButton } from "../receipt-button";
import { formatDate } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { useDpayTransactionById } from "@/lib/hooks/swr/dpay/useDpayTransactionById";
import { useEffect, useRef, useState } from "react";

interface TransactionHistoryContentProps {
  externalUserId?: string;
  userName?: string;
  casinoLink?: string;
  casinoName?: string;
}

export function TransactionHistoryContent({
  externalUserId,
  userName,
  casinoLink = "qbet88.vip",
  casinoName,
}: TransactionHistoryContentProps) {
  const COOLDOWN_SECONDS = 10;
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const cooldownRef = useRef<NodeJS.Timeout | null>(null);

  const {
    transactions = [],
    error: historyError,
    isLoading: isLoadingHistory,
    mutate: fetchTransactionHistory,
  } = useDpayTransactionById(externalUserId);

  useEffect(() => {
    // Clear on unmount
    return () => clearInterval(cooldownRef.current as any);
  }, []);

  useEffect(() => {
    if (cooldownRemaining > 0) {
      cooldownRef.current = setInterval(() => {
        setCooldownRemaining((v) => {
          if (v <= 1) {
            clearInterval(cooldownRef.current as any);
            return 0;
          }
          return v - 1;
        });
      }, 1000);
    }
    return () => clearInterval(cooldownRef.current as any);
  }, [cooldownRemaining]);

  const handleFetchWithCooldown = async () => {
    if (cooldownRemaining > 0) return;
    await fetchTransactionHistory();
    setCooldownRemaining(COOLDOWN_SECONDS);
  };

  return (
    <Card>
      <CardContent>
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Transaction History</h3>
          <div className="flex flex-row gap-2 flex-wrap">
            <Link href={`https://www.${casinoLink}`}>
              <Button variant={"outline"}>
                <MoveUpLeft className="h-4 w-4" />
                Go back{" "}
                <span className="sm:block hidden -ml-1">to {casinoName}</span>
              </Button>
            </Link>

            <Button
              onClick={handleFetchWithCooldown}
              disabled={isLoadingHistory || cooldownRemaining > 0}
              variant="outline"
            >
              {isLoadingHistory ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4" />
                  Loading...
                </>
              ) : cooldownRemaining > 0 ? (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Wait {cooldownRemaining}s
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Refresh<span className="hidden sm:block -ml-1">History</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {isLoadingHistory && (
          <div className="space-y-4 py-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <Card key={idx} className="overflow-hidden">
                <CardContent className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                  <div className="space-y-1">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Error State */}
        {historyError && !isLoadingHistory && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{historyError}</AlertDescription>
          </Alert>
        )}

        {/* Empty State */}
        {!isLoadingHistory && !historyError && transactions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-sm sm:text-base">
              No transactions found
            </p>
            <p className="text-muted-foreground text-xs mt-2">
              Your transaction history will appear here
            </p>
          </div>
        )}

        {/* Transaction List */}
        {!isLoadingHistory && transactions.length > 0 && (
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <Card key={transaction.id} className="overflow-hidden">
                <CardContent>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColorClass(transaction.type)}>
                        {getStatusIcon(transaction.type)}
                        {transaction.type}
                      </Badge>

                      <Badge
                        className={getStatusColorClass(transaction.status)}
                      >
                        {getStatusIcon(transaction.status)}
                        {transaction.status}
                      </Badge>
                    </div>

                    <p className="text-lg font-bold">
                      ₱{transaction.amount.toLocaleString()}
                    </p>
                  </div>

                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ID:</span>
                      <span className="font-mono text-xs">
                        {transaction.id.substring(0, 12)}...
                      </span>
                    </div>

                    {transaction.paymentMethod && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Payment Method:
                        </span>
                        <span>{transaction.paymentMethod}</span>
                      </div>
                    )}

                    {transaction.bankDetails && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Bank Details:
                        </span>
                        <span className="text-right text-xs max-w-[200px] truncate">
                          {transaction.bankDetails}
                        </span>
                      </div>
                    )}

                    {transaction.receiptUrl && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Receipt:</span>
                        <ReceiptButton
                          receiptUrl={transaction.receiptUrl}
                          transactionId={transaction.id}
                          variant="link"
                        />
                      </div>
                    )}

                    <div className="flex justify-between pt-2 border-t">
                      <span className="text-muted-foreground">Created:</span>
                      <span className="text-xs">
                        {formatDate(
                          new Date(transaction.createdAt),
                          "MMM dd, yyyy HH:mm"
                        )}
                      </span>
                    </div>

                    {transaction.remarks && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Remarks:</span>
                        <span className="text-right text-xs max-w-[200px] truncate italic">
                          {transaction.remarks}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {transactions.length >= 50 && (
              <p className="text-center text-xs text-muted-foreground pt-4">
                Showing last 50 transactions
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

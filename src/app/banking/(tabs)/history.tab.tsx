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
import { Transaction } from "../page";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

interface TransactionHistoryContentProps {
  transactions: Transaction[];
  isLoadingHistory: boolean;
  historyError: string | null;
  casinoLink: string;
  cooldownRemaining: number;
  fetchTransactionHistory: () => void;
}

export function TransactionHistoryContent({
  transactions,
  isLoadingHistory,
  historyError,
  cooldownRemaining,
  casinoLink,
  fetchTransactionHistory,
}: TransactionHistoryContentProps) {
  return (
    <Card>
      <CardContent>
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Transaction History</h3>
          <div className="flex flex-row gap-2">
            <Link href={`https://www.${casinoLink}`}>
              <Button variant={"outline"}>
                <MoveUpLeft className="h-4 w-4" />
                Go back to qbet88.vip
              </Button>
            </Link>

            <Button
              onClick={fetchTransactionHistory}
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
                  Refresh History
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

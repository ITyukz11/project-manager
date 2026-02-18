"use client";

import { useState, useEffect, useMemo } from "react";
import { DataTable } from "@/components/table/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeftRight,
  Banknote,
  RefreshCw,
  TriangleAlert,
  Wallet,
} from "lucide-react";
import { useTransactionRequest } from "@/lib/hooks/swr/transaction-request/useTransactionRequest";
import { transactionRequestColumns } from "@/components/table/transaction-request/transaction-request-columns";
import { TransactionDetailsDialog } from "./TransactionDetailsDialog";
import { Title } from "@/components/Title";
import { Badge } from "@/components/ui/badge";
import { getStatusColorClass } from "@/components/getStatusColorClass";
import { useBalance } from "@/lib/hooks/swr/qbet88/useBalance";
import { formatPhpAmount } from "@/components/formatAmount";
import { Spinner } from "@/components/ui/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DateRange } from "react-day-picker";
import { MetricsCards } from "@/components/MetricCards";
import { endOfDay, parseISO, startOfDay } from "date-fns";
import { useParams, useRouter, useSearchParams } from "next/navigation";

export default function Page() {
  const params = useParams();
  const casinoGroup = params.casinogroup;

  const [viewRow, setViewRow] = useState(false);
  const [transactionId, setTransactionId] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();

  // ✅ Parse dateRange from URL params
  const dateRange: DateRange = useMemo(() => {
    const today = new Date();
    const fromParam = searchParams.get(`from-${casinoGroup}`);
    const toParam = searchParams.get(`to-${casinoGroup}`);

    let from: Date;
    let to: Date;

    try {
      from = fromParam ? startOfDay(parseISO(fromParam)) : startOfDay(today);
      to = toParam ? endOfDay(parseISO(toParam)) : endOfDay(today);
    } catch {
      from = startOfDay(today);
      to = endOfDay(today);
    }

    return { from, to };
  }, [searchParams, casinoGroup]);

  // ✅ Update URL when dateRange changes
  const setDateRange = (range: DateRange | undefined) => {
    const params = new URLSearchParams(searchParams.toString());
    if (range?.from)
      params.set(`from-${casinoGroup}`, range.from.toISOString());
    if (range?.to) params.set(`to-${casinoGroup}`, range.to.toISOString());
    router.replace(`?${params.toString()}`);
  };

  const { transactionRequests, isLoading, error, lastUpdate, refetch } =
    useTransactionRequest(casinoGroup?.toLocaleString() || "", dateRange);

  const {
    balance,
    isLoading: balanceLoading,
    refreshBalance,
    isValidating: balanceValidating,
  } = useBalance("NEFTUAO2A0LHYYXO");

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Trigger temporary animation whenever lastUpdate changes
  useEffect(() => {
    if (!lastUpdate) return;

    // ✅ Defer state update to avoid synchronous setState warning
    const timer = setTimeout(() => {
      setIsRefreshing(true);

      const resetTimer = setTimeout(() => setIsRefreshing(false), 1500);
      return () => clearTimeout(resetTimer);
    }, 0);

    return () => clearTimeout(timer);
  }, [lastUpdate]);

  const hiddenColumns = ["bankDetails", "action"];

  // Compute status metrics
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    if (transactionRequests) {
      transactionRequests.forEach((c) => {
        counts[c.status] = (counts[c.status] || 0) + 1;
      });
    }
    return counts;
  }, [transactionRequests]);

  const STATUS_ORDER = ["ACCOMMODATING", "CLAIMED", "APPROVED", "REJECTED"];

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    if (transactionRequests) {
      transactionRequests.forEach((c) => {
        counts[c.type] = (counts[c.type] || 0) + 1;
      });
    }
    return counts;
  }, [transactionRequests]);

  const totalAmountApproved = useMemo(() => {
    if (!transactionRequests) return 0;
    return transactionRequests
      .filter((tx) => tx.status === "APPROVED")
      .reduce((sum, tx) => sum + tx.amount, 0);
  }, [transactionRequests]);

  const totalAmountPending = useMemo(() => {
    if (!transactionRequests) return 0;
    return transactionRequests
      .filter((tx) => tx.status === "PENDING")
      .reduce((sum, tx) => sum + tx.amount, 0);
  }, [transactionRequests]);

  const totalAmountRejected = useMemo(() => {
    if (!transactionRequests) return 0;
    return transactionRequests
      .filter((tx) => tx.status === "REJECTED")
      .reduce((sum, tx) => sum + tx.amount, 0);
  }, [transactionRequests]);

  const metrics = useMemo(
    () => [
      {
        title: "Total Transactions",
        amount: transactionRequests.length,
        count: 0, // transactions don't need count
        icon: <ArrowLeftRight className="shrink-0 h-6 w-6 text-white" />,
        bgColor: "bg-purple-500 dark:bg-purple-600",
      },
      {
        title: "Total Approved Amount",
        amount: totalAmountApproved,
        count: transactionRequests.filter((t) => t.status === "APPROVED")
          .length,
        icon: <Banknote className="shrink-0 h-6 w-6 text-white" />,
        bgColor: `${getStatusColorClass("APPROVED")}`,
      },
      {
        title: "Total Pending Amount",
        amount: totalAmountPending,
        count: transactionRequests.filter((t) => t.status === "PENDING").length,
        icon: <Banknote className="shrink-0 h-6 w-6 text-white" />,
        bgColor: `${getStatusColorClass("PENDING")}`,
      },
      {
        title: "Total Rejected Amount",
        amount: totalAmountRejected,
        count: transactionRequests.filter((t) => t.status === "REJECTED")
          .length,
        icon: <Banknote className="shrink-0 h-6 w-6 text-white" />,
        bgColor: `${getStatusColorClass("REJECTED")}`,
      },
    ],
    [
      transactionRequests,
      totalAmountApproved,
      totalAmountPending,
      totalAmountRejected,
    ],
  );

  return (
    <>
      <Card>
        <CardContent>
          <Title
            title={`${casinoGroup
              ?.toLocaleString()
              .toUpperCase()} Gateway Requests`}
            subtitle="Track manual payment requests from users real-time"
            lastUpdate={lastUpdate}
            isRefreshing={isRefreshing}
            icon={
              <ArrowLeftRight className="h-5 w-5 md:h-6 md:w-6 text-green-600 dark:text-green-400" />
            }
            live
            error={error}
            right={
              casinoGroup?.toLocaleString().toLocaleLowerCase() ===
              "qbet88.vip" ? (
                <div
                  className="
                xl:absolute right-10
    flex flex-col gap-1 
    bg-green-100 dark:bg-green-950 
    border border-green-300 dark:border-green-800
    rounded-lg 
    px-4 py-2
    max-w-[95vw] sm:max-w-xs
  "
                >
                  {/* Title Row */}
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-green-700 dark:text-green-200 font-semibold">
                    <Wallet className="h-4 w-4 shrink-0 text-green-700 dark:text-green-300" />
                    <span className="truncate text-xs sm:text-sm">
                      Gateway Balance
                    </span>
                  </div>

                  {/* Value / State */}
                  <div>
                    {balanceLoading ? (
                      <Skeleton className="h-3 w-24 sm:w-32 my-1 sm:my-2 bg-green-200 dark:bg-green-800" />
                    ) : error ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center text-red-600 text-xs sm:text-sm">
                            <TriangleAlert className="w-4 h-4 sm:w-5 sm:h-5 mr-1" />
                            Error
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          <span>{error}</span>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <div className="flex flex-row gap-1 font-bold text-base sm:text-lg text-green-700 dark:text-green-200">
                        {balanceValidating ? (
                          <Skeleton className="h-3 w-24 my-1 sm:my-2 bg-green-200 dark:bg-green-800" />
                        ) : (
                          formatPhpAmount(balance)
                        )}
                        <button
                          type="button"
                          onClick={() => refreshBalance()}
                          disabled={balanceLoading}
                          title="Refresh balance"
                          className="cursor-pointer flex items-center justify-center"
                        >
                          {!balanceLoading && !balanceValidating ? (
                            <RefreshCw className="w-3.5 h-3.5 text-green-700 dark:text-green-300" />
                          ) : (
                            <Spinner className="text-green-700 dark:text-green-300" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <></>
              )
            }
          />

          {/* Status Metrics */}
          <div className="flex flex-col flex-wrap gap-2 mx-1 mt-1">
            <div className="flex flex-wrap gap-2 mx-1">
              {["CASHIN", "CASHOUT"].map((type) => (
                <Badge
                  key={type}
                  className={`text-xs ${getStatusColorClass(type)}`}
                >
                  {type}: {typeCounts[type] || 0}
                </Badge>
              ))}
              {STATUS_ORDER.map((status) => (
                <Badge
                  key={status}
                  className={`text-xs ${getStatusColorClass(status)}`}
                >
                  {status}: {statusCounts[status] || 0}
                </Badge>
              ))}
            </div>
            <MetricsCards metrics={metrics} isLoading={isLoading} />
          </div>
          {/* Table */}
          {isLoading ? (
            <div className="w-full flex flex-col gap-2 items-center">
              <Skeleton className="w-full h-10" />
              <Skeleton className="w-full h-40" />
            </div>
          ) : (
            <DataTable
              data={transactionRequests}
              columns={transactionRequestColumns}
              hiddenColumns={hiddenColumns}
              cursorRowSelect
              allowExportData
              onViewRowId={(id) => {
                setTransactionId(id);
                setViewRow(true);
              }}
              setAllowViewRow={() => setViewRow(true)}
              allowDateRange
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
            />
          )}
        </CardContent>
      </Card>

      {/* Transaction Details Dialog */}
      <TransactionDetailsDialog
        open={viewRow}
        onOpenChange={setViewRow}
        transactionId={transactionId}
        refetch={refetch}
      />
    </>
  );
}

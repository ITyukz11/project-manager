"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { DataTable } from "@/components/table/data-table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeftRight, Banknote, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getStatusColorClass } from "@/components/getStatusColorClass";
import { useDPayTransactionLogs } from "@/lib/hooks/swr/dpay/useDPayTransactionLogs";
import { getDpayTransactionColumns } from "./dPayTransactionColumns";
import { QBETACCOUNTS } from "./data";
import { useSession } from "next-auth/react";
import { ADMINROLES } from "@/lib/types/role";
import { MetricsCards } from "@/components/MetricCards";
import { DateRange } from "react-day-picker";
import { endOfDay, parseISO, startOfDay } from "date-fns";

const Page = () => {
  const params = useParams();
  const casinoGroup = params.casinogroup as string;
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [filterEjticon, setFilterEjticon] = useState(false);
  const { data: session } = useSession();
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

  /**
   * ✅ Fetch cashins using dateRange
   */
  const { transactionLogs, error, isLoading } = useDPayTransactionLogs(
    casinoGroup,
    dateRange,
  );

  const qbetAccountIdSet = useMemo(
    () => new Set(QBETACCOUNTS.map((a) => a.id)),
    [],
  );
  const filteredTransactionLogs = useMemo(() => {
    if (!transactionLogs) return [];
    if (!filterEjticon) return transactionLogs;

    return transactionLogs.filter((tx) =>
      qbetAccountIdSet.has(tx.referenceUserId),
    );
  }, [transactionLogs, filterEjticon, qbetAccountIdSet]);

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    if (filteredTransactionLogs) {
      filteredTransactionLogs.forEach((c) => {
        counts[c.type] = (counts[c.type] || 0) + 1;
      });
    }
    return counts;
  }, [filteredTransactionLogs]);

  /**
   * ✅ Compute status metrics
   */
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    if (filteredTransactionLogs) {
      filteredTransactionLogs.forEach((c) => {
        counts[c.status] = (counts[c.status] || 0) + 1;
      });
    }
    return counts;
  }, [filteredTransactionLogs]);

  const STATUS_ORDER = ["PENDING", "COMPLETED"];

  const handleCopy = async (externalUserId: string) => {
    try {
      await navigator.clipboard.writeText(externalUserId);
      setCopiedId(externalUserId);
      setTimeout(() => setCopiedId(null), 2000); // 2 seconds
    } catch (err) {
      console.error("Failed to copy!", err);
    }
  };

  const totalAmountCompleted = useMemo(() => {
    if (!filteredTransactionLogs) return 0;
    return filteredTransactionLogs
      .filter((tx) => tx.status === "COMPLETED")
      .reduce((sum, tx) => sum + tx.amount, 0);
  }, [filteredTransactionLogs]);

  const totalAmountPending = useMemo(() => {
    if (!filteredTransactionLogs) return 0;
    return filteredTransactionLogs
      .filter((tx) => tx.status === "PENDING")
      .reduce((sum, tx) => sum + tx.amount, 0);
  }, [filteredTransactionLogs]);

  const totalAmountRejected = useMemo(() => {
    if (!filteredTransactionLogs) return 0;
    return filteredTransactionLogs
      .filter((tx) => tx.status === "REJECTED")
      .reduce((sum, tx) => sum + tx.amount, 0);
  }, [filteredTransactionLogs]);

  const metrics = useMemo(
    () => [
      {
        title: "Total Transactions",
        amount: filteredTransactionLogs.length,
        count: 0, // transactions don't need count
        icon: <ArrowLeftRight className="shrink-0 h-6 w-6 text-white" />,
        bgColor: "bg-purple-500 dark:bg-purple-600",
      },
      {
        title: "Total Completed Amount",
        amount: totalAmountCompleted,
        count: filteredTransactionLogs.filter((t) => t.status === "COMPLETED")
          .length,
        icon: <Banknote className="shrink-0 h-6 w-6 text-white" />,
        bgColor: `${getStatusColorClass("COMPLETED")}`,
      },
      {
        title: "Total Pending Amount",
        amount: totalAmountPending,
        count: filteredTransactionLogs.filter((t) => t.status === "PENDING")
          .length,
        icon: <Banknote className="shrink-0 h-6 w-6 text-white" />,
        bgColor: `${getStatusColorClass("PENDING")}`,
      },
      {
        title: "Total Rejected Amount",
        amount: totalAmountRejected,
        count: filteredTransactionLogs.filter((t) => t.status === "REJECTED")
          .length,
        icon: <Banknote className="shrink-0 h-6 w-6 text-white" />,
        bgColor: `${getStatusColorClass("REJECTED")}`,
      },
    ],
    [
      filteredTransactionLogs,
      totalAmountCompleted,
      totalAmountPending,
      totalAmountRejected,
    ],
  );

  return (
    <div className="space-y-2">
      {/* Error Tooltip */}
      <div className="flex items-center justify-end gap-2">
        {error && (
          <Tooltip>
            <TooltipTrigger asChild>
              <TriangleAlert className="text-red-500" />
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={6} className="max-w-xs">
              <div className="text-sm text-red-400 dark:text-red-700">
                {error?.message ||
                  "Error loading accounts. Please try again later."}
              </div>
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* Status Metrics */}
      <div className="flex flex-col gap-2">
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
          {session?.user?.role === ADMINROLES.SUPERADMIN ||
            (session?.user?.role === ADMINROLES.ADMIN && (
              <div className="flex gap-2 mx-1">
                <Badge
                  onClick={() => setFilterEjticon((v) => !v)}
                  className={`cursor-pointer text-xs ${
                    filterEjticon
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 dark:bg-gray-700"
                  }`}
                >
                  {filterEjticon ? "Showing ejticon11" : "Filter ejticon11"}
                </Badge>
              </div>
            ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <MetricsCards metrics={metrics} isLoading={isLoading} />
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="w-full flex flex-col gap-2 items-center mt-2">
          <Skeleton className="w-full h-10" />
          <Skeleton className="w-full h-40" />
        </div>
      ) : (
        <DataTable
          data={filteredTransactionLogs}
          columns={getDpayTransactionColumns({ handleCopy, copiedId })}
          hiddenColumns={["updatedAt", "transactionNumber"]}
          allowDateRange
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          allowExportData
        />
      )}
    </div>
  );
};

export default Page;

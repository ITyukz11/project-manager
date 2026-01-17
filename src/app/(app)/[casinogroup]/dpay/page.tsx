"use client";

import { useState, useMemo, useEffect } from "react";
import type { DateRange } from "react-day-picker";
import { useParams, useRouter } from "next/navigation";
import { DataTable } from "@/components/table/data-table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getStatusColorClass } from "@/components/getStatusColorClass";
import { useDPayTransactionLogs } from "@/lib/hooks/swr/dpay/useDPayTransactionLogs";
import { getDpayTransactionColumns } from "./dPayTransactionColumns";

const Page = () => {
  const params = useParams();
  const casinoGroup = params.casinogroup as string;
  const router = useRouter();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  /**
   * 🔑 Per-casinoGroup storage key
   */
  const STORAGE_KEY = `dpay-date-range:${casinoGroup}`;

  /**
   * ✅ Lazy initialize dateRange from localStorage
   */
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const today = new Date();

    if (typeof window === "undefined") {
      return { from: today, to: today };
    }

    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return { from: today, to: today };
    }

    try {
      const parsed = JSON.parse(stored);
      return {
        from: parsed.from ? new Date(parsed.from) : today,
        to: parsed.to ? new Date(parsed.to) : today,
      };
    } catch {
      return { from: today, to: today };
    }
  });

  /**
   * ✅ Persist dateRange to localStorage
   */
  useEffect(() => {
    if (!dateRange) return;

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        from: dateRange.from?.toISOString(),
        to: dateRange.to?.toISOString(),
      }),
    );
  }, [dateRange, STORAGE_KEY]);

  /**
   * ✅ Fetch cashins using dateRange
   */
  const { transactionLogs, error, isLoading } = useDPayTransactionLogs(
    casinoGroup,
    dateRange,
  );

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    if (transactionLogs) {
      transactionLogs.forEach((c) => {
        counts[c.type] = (counts[c.type] || 0) + 1;
      });
    }
    return counts;
  }, [transactionLogs]);

  /**
   * ✅ Compute status metrics
   */
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    if (transactionLogs) {
      transactionLogs.forEach((c) => {
        counts[c.status] = (counts[c.status] || 0) + 1;
      });
    }
    return counts;
  }, [transactionLogs]);

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
      <div className="flex flex-wrap gap-2 mx-1">
        <Badge
          className={`text-xs bg-purple-200 dark:bg-purple-800 text-purple-900 dark:text-purple-200 border border-purple-300 dark:border-purple-700`}
        >
          Total Transactions: {transactionLogs.length}
        </Badge>
        {["CASHIN", "CASHOUT"].map((type) => (
          <Badge key={type} className={`text-xs ${getStatusColorClass(type)}`}>
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

      {/* Table */}
      {isLoading ? (
        <div className="w-full flex flex-col gap-2 items-center mt-2">
          <Skeleton className="w-full h-10" />
          <Skeleton className="w-full h-40" />
        </div>
      ) : (
        <DataTable
          data={transactionLogs}
          columns={getDpayTransactionColumns({ handleCopy, copiedId })}
          hiddenColumns={["updatedAt", "transactionNumber"]}
          allowDateRange
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
        />
      )}
    </div>
  );
};

export default Page;

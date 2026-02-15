"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { DataTable } from "@/components/table/data-table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeftRight, Banknote, TriangleAlert, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getStatusColorClass } from "@/components/getStatusColorClass";
import { useStoredDateRange } from "@/lib/hooks/useStoredDateRange";
import { useSession } from "next-auth/react";
import { ADMINROLES } from "@/lib/types/role";
import { QBETACCOUNTS } from "../dpay/data";
import { useOpayTransactionLogs } from "@/lib/hooks/swr/optimum-pay/useOPayTransactionLogs";
import { getOPayTransactionColumns } from "./oPayTransactionColumns";

const Page = () => {
  const params = useParams();
  const casinoGroup = params.casinogroup as string;
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [filterEjticon, setFilterEjticon] = useState(false);
  const { data: session } = useSession();
  /**
   * 🔑 Per-casinoGroup storage key
   */
  const STORAGE_KEY = `opay-date-range:${casinoGroup}`;

  const { dateRange, setDateRange } = useStoredDateRange(STORAGE_KEY);

  /**
   * ✅ Fetch cashins using dateRange
   */
  const { transactionLogs, error, isLoading } = useOpayTransactionLogs(
    casinoGroup,
    dateRange,
  );

  console.log("transactionLogs", transactionLogs);

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

  const totalAmountCashin = useMemo(() => {
    if (!filteredTransactionLogs) return 0;
    return filteredTransactionLogs
      .filter((tx) => tx.status === "COMPLETED")
      .reduce((sum, tx) => sum + tx.amount, 0);
  }, [filteredTransactionLogs]);

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
        </div>
        <div className="flex flex-wrap gap-2 mx-1">
          <Badge
            className={`text-xs bg-sky-200 dark:bg-sky-800 text-white border border-sky-300 dark:border-sky-700`}
          >
            <ArrowLeftRight /> Transactions: {filteredTransactionLogs.length}
          </Badge>
          <Badge
            className={`text-xs bg-yellow-200 dark:bg-yellow-800 text-white border border-yellow-300 dark:border-yellow-700`}
          >
            <Users />
            Users:{" "}
            {
              new Set(filteredTransactionLogs.map((tx) => tx.referenceUserId))
                .size
            }
          </Badge>

          <Badge
            className={`text-xs bg-green-200 dark:bg-green-800 text-white border border-green-300 dark:border-green-700`}
          >
            <Banknote /> Total Completed Amount:{" "}
            {totalAmountCashin.toLocaleString()}
          </Badge>
        </div>
      </div>
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

      {/* Table */}
      {isLoading ? (
        <div className="w-full flex flex-col gap-2 items-center mt-2">
          <Skeleton className="w-full h-10" />
          <Skeleton className="w-full h-40" />
        </div>
      ) : (
        <DataTable
          data={filteredTransactionLogs}
          columns={getOPayTransactionColumns({ handleCopy, copiedId })}
          hiddenColumns={["updatedAt", "Transaction Number"]}
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

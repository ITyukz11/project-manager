"use client";

import { useMemo } from "react";
import { useCashouts } from "@/lib/hooks/swr/cashout/useCashouts";
import { DataTable } from "@/components/table/data-table";
import { cashoutColumns } from "@/components/table/cashout/cashoutColumns";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeftRight, Banknote, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getStatusColorClass } from "@/components/getStatusColorClass";
import { DateRange } from "react-day-picker";
import { startOfDay, endOfDay, parseISO } from "date-fns";
import { MetricsCards } from "@/components/MetricCards";

const Page = () => {
  const params = useParams();
  const casinoGroup = params.casinogroup as string;
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

  // ✅ Fetch cashouts using dateRange
  const { cashouts, error, isLoading } = useCashouts(casinoGroup, dateRange);

  // ✅ Compute status metrics
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    if (cashouts) {
      cashouts.forEach((c) => {
        counts[c.status] = (counts[c.status] || 0) + 1;
      });
    }
    return counts;
  }, [cashouts]);

  const STATUS_ORDER = ["PENDING", "PARTIAL", "COMPLETED", "REJECTED"];

  const totalAmountCompleted = useMemo(
    () =>
      cashouts
        ? cashouts
            .filter((c) => c.status === "COMPLETED")
            .reduce((sum, c) => sum + c.amount, 0)
        : 0,
    [cashouts],
  );

  const totalAmountPending = useMemo(
    () =>
      cashouts
        ? cashouts
            .filter((c) => c.status === "PENDING")
            .reduce((sum, c) => sum + c.amount, 0)
        : 0,
    [cashouts],
  );

  const totalAmountRejected = useMemo(
    () =>
      cashouts
        ? cashouts
            .filter((c) => c.status === "REJECTED")
            .reduce((sum, c) => sum + c.amount, 0)
        : 0,
    [cashouts],
  );

  const metrics = useMemo(
    () => [
      {
        title: "Total Transactions",
        amount: cashouts.length,
        count: 0,
        icon: <ArrowLeftRight className="shrink-0 h-6 w-6 text-white" />,
        bgColor: "bg-sky-500 dark:bg-sky-600",
      },
      {
        title: "Total Completed Amount",
        amount: totalAmountCompleted,
        count: cashouts.filter((t) => t.status === "COMPLETED").length,
        icon: <Banknote className="shrink-0 h-6 w-6 text-white" />,
        bgColor: `${getStatusColorClass("COMPLETED")}`,
      },
      {
        title: "Total Pending Amount",
        amount: totalAmountPending,
        count: cashouts.filter((t) => t.status === "PENDING").length,
        icon: <Banknote className="shrink-0 h-6 w-6 text-white" />,
        bgColor: `${getStatusColorClass("PENDING")}`,
      },
      {
        title: "Total Rejected Amount",
        amount: totalAmountRejected,
        count: cashouts.filter((t) => t.status === "REJECTED").length,
        icon: <Banknote className="shrink-0 h-6 w-6 text-white" />,
        bgColor: `${getStatusColorClass("REJECTED")}`,
      },
    ],
    [cashouts, totalAmountCompleted, totalAmountPending, totalAmountRejected],
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
      <div className="flex flex-col flex-wrap gap-2 mx-1 mt-1">
        <div className="flex flex-wrap gap-2 mx-1">
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
        <div className="w-full flex flex-col gap-2 items-center mt-2">
          <Skeleton className="w-full h-10" />
          <Skeleton className="w-full h-40" />
        </div>
      ) : (
        <DataTable
          data={cashouts}
          columns={cashoutColumns}
          cursorRowSelect
          hiddenColumns={["details", "updatedAt"]}
          onViewRowId={(id) => router.push(`/${casinoGroup}/cash-outs/${id}`)}
          allowDateRange
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
        />
      )}
    </div>
  );
};

export default Page;

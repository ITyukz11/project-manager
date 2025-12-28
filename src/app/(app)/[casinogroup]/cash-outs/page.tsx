"use client";

import { useState, useMemo } from "react";
import type { DateRange } from "react-day-picker";
import { useCashouts } from "@/lib/hooks/swr/cashout/useCashouts";
import { DataTable } from "@/components/table/data-table";
import { cashoutColumns } from "@/components/table/cashout/cashoutColumns";
import { useParams, useRouter } from "next/navigation";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getStatusColorClass } from "@/components/getStatusColorClass";

const Page = () => {
  const params = useParams();
  const casinoGroup = params.casinogroup as string;
  const router = useRouter();

  const today = new Date();

  // ✅ Lift dateRange state to Page
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: today,
    to: today,
  });

  // ✅ Pass dateRange to SWR hook
  const { cashouts, error, isLoading } = useCashouts(casinoGroup, dateRange);

  // Compute status metrics
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
          data={cashouts}
          columns={cashoutColumns}
          cursorRowSelect
          hiddenColumns={["details", "updatedAt"]}
          onViewRowId={(id) => router.push(`/${casinoGroup}/cash-outs/` + id)}
          allowDateRange
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
        />
      )}
    </div>
  );
};

export default Page;

"use client";

import { DataTable } from "@/components/table/data-table";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { TriangleAlert } from "lucide-react";
import { useConcerns } from "@/lib/hooks/swr/concern/useConcerns";
import { concernColumn } from "@/components/table/concern/concernColumn";
import { Badge } from "@/components/ui/badge";
import { getStatusColorClass } from "@/components/getStatusColorClass";
import { useMemo } from "react";
import { DateRange } from "react-day-picker";
import { endOfDay, parseISO, startOfDay } from "date-fns";

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

  /**
   * ✅ Fetch concerns using dateRange
   */
  const { concerns, error, isLoading } = useConcerns(casinoGroup, dateRange);

  /**
   * ✅ Compute status metrics
   */
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    if (concerns) {
      concerns.forEach((c) => {
        counts[c.status] = (counts[c.status] || 0) + 1;
      });
    }
    return counts;
  }, [concerns]);

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
        <div className="w-full flex flex-col gap-2 items-center">
          <Skeleton className="w-full h-10" />
          <Skeleton className="w-full h-40" />
        </div>
      ) : (
        <DataTable
          data={concerns}
          columns={concernColumn}
          cursorRowSelect
          hiddenColumns={["details", "updatedAt"]}
          onViewRowId={(id) => router.push(`/${casinoGroup}/concerns/${id}`)}
          allowDateRange
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
        />
      )}
    </div>
  );
};

export default Page;

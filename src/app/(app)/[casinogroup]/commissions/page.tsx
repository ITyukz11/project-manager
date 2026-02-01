"use client";

import { useEffect, useMemo, useState } from "react";
import { useCommissions } from "@/lib/hooks/swr/commission/useCommissions";
import { DataTable } from "@/components/table/data-table";
import { commissionColumns } from "@/components/table/commission/commissionColumns";
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
import { DateRange } from "react-day-picker";
import { CommissionDetailsDialog } from "./(components)/CommissionDetailsDialog";

const Page = () => {
  const params = useParams();
  const casinoGroup = params.casinogroup as string;
  const router = useRouter();
  const [commissionId, setCommissionId] = useState<string>("");
  const [open, setOpen] = useState(false);

  /**
   * 🔑 Per-casinoGroup storage key
   */
  const STORAGE_KEY = `commissions-date-range:${casinoGroup}`;
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
  /**
   * ✅ Fetch commissions using dateRange
   */
  const { commissions, error, isLoading, refetch } = useCommissions(
    casinoGroup,
    dateRange,
  );

  /**
   * ✅ Compute status metrics
   */
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    if (commissions) {
      commissions.forEach((c) => {
        counts[c.status] = (counts[c.status] || 0) + 1;
      });
    }
    return counts;
  }, [commissions]);

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
          data={commissions}
          columns={commissionColumns}
          cursorRowSelect
          hiddenColumns={["details", "updatedAt"]}
          // onViewRowId={(id) => router.push(`/${casinoGroup}/commissions/${id}`)}
          onViewRowId={(id) => {
            setCommissionId(id);
            setOpen(true);
          }}
          allowDateRange
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
        />
      )}
      <CommissionDetailsDialog
        open={open}
        onOpenChange={setOpen}
        commissionId={commissionId}
        refetch={refetch}
      />
    </div>
  );
};

export default Page;

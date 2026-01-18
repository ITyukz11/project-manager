"use client";

import { DataTable } from "@/components/table/data-table";
import { useParams, useRouter } from "next/navigation";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { TriangleAlert } from "lucide-react";
import { useTask } from "@/lib/hooks/swr/task/useTask";
import { taskColumn } from "@/components/table/task/taskColumns";
import { Badge } from "@/components/ui/badge";
import { getStatusColorClass } from "@/components/getStatusColorClass";
import { useMemo } from "react";
import { useStoredDateRange } from "@/lib/hooks/useStoredDateRange";

// Adjust the order and labels as needed
const STATUS_ORDER = ["PENDING", "COMPLETED"];

const Page = () => {
  const params = useParams();
  const casinoGroup = params.casinogroup as string;
  const router = useRouter();

  /**
   * 🔑 Per-casinoGroup storage key
   */
  const STORAGE_KEY = `tasks-date-range:${casinoGroup}`;

  const { dateRange, setDateRange } = useStoredDateRange(STORAGE_KEY);
  /**
   * ✅ Fetch tasks using dateRange
   */
  const { tasks, error, isLoading } = useTask(casinoGroup, dateRange);

  /**
   * ✅ Status metrics
   */
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    if (tasks) {
      tasks.forEach((t) => {
        counts[t.status] = (counts[t.status] || 0) + 1;
      });
    }
    return counts;
  }, [tasks]);

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
                  "Error loading tasks. Please try again later."}
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
          data={tasks}
          columns={taskColumn}
          cursorRowSelect
          hiddenColumns={["details", "updatedAt"]}
          onViewRowId={(id) => router.push(`/${casinoGroup}/tasks/${id}`)}
          allowDateRange
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
        />
      )}
    </div>
  );
};

export default Page;

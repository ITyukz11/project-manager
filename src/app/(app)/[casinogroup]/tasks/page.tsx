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
import { remittanceColumn } from "@/components/table/remittance/remittanceColumns";
import { useTask } from "@/lib/hooks/swr/task/useTask";
import { taskColumn } from "@/components/table/task/taskColumns";

const Page = () => {
  const params = useParams();
  const casinoGroup = params.casinogroup as string;
  const { tasks, error, isLoading } = useTask(casinoGroup);

  const router = useRouter();
  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex flex-row gap-2 ml-auto">
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
          onViewRowId={(id) => router.push(`/${casinoGroup}/tasks/` + id)}
        />
      )}
    </div>
  );
};

export default Page;

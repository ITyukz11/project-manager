"use client";
import { DataTable } from "@/components/table/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TriangleAlert } from "lucide-react";
import { networkGCManagerColumn } from "@/components/table/network/networkGCManagerColumn";
import { useGroupChats } from "@/lib/hooks/swr/network/useGroupChat";

export default function GroupChatManagerTab() {
  const { groupChatsData, groupChatsError, groupChatsLoading } =
    useGroupChats();
  const hiddenColumns = ["createdAt"];
  console.log("groupChatsData:", groupChatsData);
  // Advanced Filter Sheet UI
  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex flex-row gap-2 ml-auto">
          {groupChatsError && (
            <Tooltip>
              <TooltipTrigger asChild>
                <TriangleAlert className="text-red-500" />
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={6} className="max-w-xs">
                <div className="text-sm text-red-400 dark:text-red-700">
                  {groupChatsError?.message ||
                    "Error loading accounts. Please try again later."}
                </div>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Table */}
      {groupChatsLoading ? (
        <div className="w-full flex flex-col gap-2 items-center">
          <Skeleton className="w-full h-10" />
          <Skeleton className="w-full h-40" />
        </div>
      ) : (
        <DataTable
          data={groupChatsData ?? []}
          columns={networkGCManagerColumn}
          allowSelectRow={false}
          hiddenColumns={hiddenColumns}
          cursorRowSelect={false}
          allowExportData={true}
        />
      )}
    </div>
  );
}

"use client";

import { DataTable } from "@/components/table/data-table";
import { networkGCManagerColumn } from "@/components/table/network/networkGCManagerColumn";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useGroupChatsByUserId } from "@/lib/hooks/swr/network/useGroupChatsByUserId";
import { ArrowLeft, TriangleAlert } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

const Page = () => {
  const { id } = useParams();
  const router = useRouter();
  const { groupChats, isLoading, error, mutate } = useGroupChatsByUserId(
    Array.isArray(id) ? id[0] : id
  );

  const hiddenColumns = ["createdAt"];

  console.log("Group Chats:", groupChats, isLoading, error);
  return (
    <div>
      <div className="flex items-center justify-between w-full">
        <div
          className="flex flex-row hover:underline text-sm text-primary cursor-pointer mb-2 items-center gap-1"
          onClick={() => router.back()}
        >
          <ArrowLeft />
          Back
        </div>
        {groupChats && (
          <Label className="text-md font-semibold">
            {id} {groupChats.length > 0 ? `(${groupChats.length} GCs)` : ""}
          </Label>
        )}

        <div className="flex flex-row gap-2">
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
          data={groupChats ?? []}
          columns={networkGCManagerColumn}
          allowSelectRow={false}
          hiddenColumns={hiddenColumns}
          cursorRowSelect={false}
          allowExportData={true}
        />
      )}
    </div>
  );
};

export default Page;

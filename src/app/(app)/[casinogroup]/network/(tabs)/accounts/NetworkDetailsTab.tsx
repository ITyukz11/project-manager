"use client";
import { DataTable } from "@/components/table/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TriangleAlert } from "lucide-react";
import { useUsersNetwork } from "@/lib/hooks/swr/network/useUserNetwork";
import { useParams } from "next/navigation";
import { getUserNetworkColumns } from "@/components/table/network/getUserNetworkColumns";
// import { AccountFormDialog } from "./(components)/AccountFormDialog";

export default function NetworkDetailsTab() {
  const params = useParams();
  const casinoGroup = params.casinogroup;
  const { usersDataNetwork, usersErrorNetwork, usersLoadingNetwork } =
    useUsersNetwork(casinoGroup?.toLocaleString());
  const hiddenColumns = ["color"];
  console.log("usersDataNetwork:", usersDataNetwork);
  // Advanced Filter Sheet UI
  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex flex-row gap-2 ml-auto">
          {usersErrorNetwork && (
            <Tooltip>
              <TooltipTrigger asChild>
                <TriangleAlert className="text-red-500" />
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={6} className="max-w-xs">
                <div className="text-sm text-red-400 dark:text-red-700">
                  {usersErrorNetwork?.message ||
                    "Error loading accounts. Please try again later."}
                </div>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Table */}
      {usersLoadingNetwork ? (
        <div className="w-full flex flex-col gap-2 items-center">
          <Skeleton className="w-full h-10" />
          <Skeleton className="w-full h-40" />
        </div>
      ) : (
        <DataTable
          data={usersDataNetwork ?? []}
          columns={getUserNetworkColumns({
            casinoGroup: casinoGroup?.toLocaleString() ?? "",
          })}
          allowSelectRow={false}
          hiddenColumns={hiddenColumns}
          cursorRowSelect={false}
          allowExportData={true}
        />
      )}
    </div>
  );
}

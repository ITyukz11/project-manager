"use client";

import { Label } from "@/components/ui/label";
import { DataTable } from "@/components/table/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TriangleAlert } from "lucide-react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { useTransactionRequest } from "@/lib/hooks/swr/transaction-request/useTransactionRequest";
import { transactionRequestColumns } from "@/components/table/transaction-request/transaction-request-columns";

export default function Page() {
  const { data: session } = useSession();
  const params = useParams();
  const casinoGroup = params.casinogroup;

  console.log("casinoGroup: ", casinoGroup);
  const { transactionRequests, isLoading, error } = useTransactionRequest(
    casinoGroup?.toLocaleString() || ""
  );
  const hiddenColumns = ["messengerLink"];
  // Advanced Filter Sheet UI

  console.log("Current User Session: ", session);
  return (
    <Card>
      <CardContent>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">
            {casinoGroup?.toLocaleString().toUpperCase()} Transaction Request
          </h1>

          <div className="flex flex-row gap-2 items-center">
            {error && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <TriangleAlert className="text-red-500" />
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  sideOffset={6}
                  className="max-w-xs"
                >
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
        ) : error ? (
          <div className="p-4 bg-red-50 text-red-700 rounded-md border border-red-200">
            <Label>Error: {error.message}</Label>
          </div>
        ) : !transactionRequests ? (
          <div className="w-full flex flex-col gap-2 items-center">
            <Skeleton className="w-full h-10" />
            <Skeleton className="w-full h-40" />
          </div>
        ) : (
          <DataTable
            data={transactionRequests}
            columns={transactionRequestColumns}
            allowSelectRow={false}
            hiddenColumns={hiddenColumns}
            cursorRowSelect={false}
            allowExportData={true}
          />
        )}
      </CardContent>
    </Card>
  );
}

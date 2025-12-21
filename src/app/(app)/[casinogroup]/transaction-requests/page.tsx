"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { DataTable } from "@/components/table/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TriangleAlert } from "lucide-react";

import { useTransactionRequest } from "@/lib/hooks/swr/transaction-request/useTransactionRequest";
import { transactionRequestColumns } from "@/components/table/transaction-request/transaction-request-columns";
import { TransactionDetailsDialog } from "./TransactionDetailsDialog";

export default function Page() {
  const params = useParams();
  const casinoGroup = params.casinogroup;

  const [viewRow, setViewRow] = useState(false);
  const [transactionId, setTransactionId] = useState<string | null>(null);

  // 🟢 REAL-TIME HOOK
  const { transactionRequests, isLoading, error, lastUpdate } =
    useTransactionRequest(casinoGroup?.toLocaleString() || "");

  const hiddenColumns = ["bankDetails", "action"];

  return (
    <>
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
                        "Error loading transactions. Please try again later."}
                    </div>
                  </TooltipContent>
                </Tooltip>
              )}

              {/* Optional: show last updated timestamp */}
              {lastUpdate && (
                <div className="text-sm text-gray-400 ml-4">
                  Last updated: {lastUpdate.toLocaleTimeString()}
                </div>
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
              data={transactionRequests}
              columns={transactionRequestColumns}
              hiddenColumns={hiddenColumns}
              cursorRowSelect
              allowExportData
              onViewRowId={(id) => {
                setTransactionId(id);
                setViewRow(true);
              }}
              setAllowViewRow={() => setViewRow(true)}
            />
          )}
        </CardContent>
      </Card>

      {/* Transaction Details Dialog */}
      <TransactionDetailsDialog
        open={viewRow}
        onOpenChange={setViewRow}
        transactionId={transactionId}
      />
    </>
  );
}

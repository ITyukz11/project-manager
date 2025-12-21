"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { DataTable } from "@/components/table/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TriangleAlert, RefreshCcw, Radio, ArrowLeftRight } from "lucide-react";

import { useTransactionRequest } from "@/lib/hooks/swr/transaction-request/useTransactionRequest";
import { transactionRequestColumns } from "@/components/table/transaction-request/transaction-request-columns";
import { TransactionDetailsDialog } from "./TransactionDetailsDialog";
import { Title } from "@/components/Title";

export default function Page() {
  const params = useParams();
  const casinoGroup = params.casinogroup;

  const [viewRow, setViewRow] = useState(false);
  const [transactionId, setTransactionId] = useState<string | null>(null);

  const { transactionRequests, isLoading, error, lastUpdate } =
    useTransactionRequest(casinoGroup?.toLocaleString() || "");

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Trigger temporary animation whenever lastUpdate changes
  useEffect(() => {
    if (!lastUpdate) return;

    // ✅ Defer state update to avoid synchronous setState warning
    const timer = setTimeout(() => {
      setIsRefreshing(true);

      const resetTimer = setTimeout(() => setIsRefreshing(false), 1500);
      return () => clearTimeout(resetTimer);
    }, 0);

    return () => clearTimeout(timer);
  }, [lastUpdate]);

  const hiddenColumns = ["bankDetails", "action"];

  return (
    <>
      <Card>
        <CardContent>
          <Title
            title={`${casinoGroup
              ?.toLocaleString()
              .toUpperCase()} Transaction Request`}
            subtitle="Track manual payment requests from users real-time"
            lastUpdate={lastUpdate}
            isRefreshing={isRefreshing}
            icon={
              <ArrowLeftRight className="h-5 w-5 md:h-6 md:w-6 text-green-600 dark:text-green-400" />
            }
            live
            error={error}
          />

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

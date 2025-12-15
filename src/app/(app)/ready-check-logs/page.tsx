"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Import your DataTable and column definition (create these for casino groups!)
import { DataTable } from "@/components/table/data-table";
import { useSession } from "next-auth/react";
import { TriangleAlert } from "lucide-react";
import useReadyChecks from "@/lib/hooks/swr/ready-check/useReadyChecks";
import { readyCheckColumns } from "@/components/table/ready-check/readyCheckColumn";

export default function ReadyCheckLogs() {
  const { data: session } = useSession();

  const { readyChecks, error, loading } = useReadyChecks();

  // Customize columns to hide if needed
  const hiddenColumns: string[] = [];
  console.log("session:", session);
  return (
    <Card>
      <CardContent>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Ready Check Logs</h1>

          <div className="flex flex-row gap-2 items-center">
            {error && <TriangleAlert className="text-red-500" />}
          </div>
        </div>

        {/* Table/List */}
        {loading ? (
          <div className="w-full flex flex-col gap-2 items-center">
            <Skeleton className="w-full h-10" />
            <Skeleton className="w-full h-40" />
          </div>
        ) : (
          <DataTable
            data={readyChecks || []}
            columns={readyCheckColumns}
            allowSelectRow={false}
            hiddenColumns={hiddenColumns}
            cursorRowSelect
            allowExportData={true}
            // onViewRowId={(id) => {
            //   setCasinoRowId(id);
            //   setEditOpen(true);
            // }}
          />
        )}
      </CardContent>
    </Card>
  );
}

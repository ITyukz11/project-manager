"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable } from "@/components/table/data-table";
import { TriangleAlert } from "lucide-react";
import { readyCheckColumns } from "@/components/table/ready-check/readyCheckColumn";
import useReadyChecks from "@/lib/hooks/swr/ready-check/useReadyChecks";
import ReadyCheckViewDialog from "@/components/ReadyCheckViewDialog";

export default function ReadyCheckLogs() {
  const { readyChecks, error, loading } = useReadyChecks();

  const [viewRowId, setViewRowId] = useState<string | null>(null);
  const [viewOpen, setViewOpen] = useState(false);

  // Handler when a row's "view" action is triggered by the DataTable
  const handleViewRow = (id?: string | number | null) => {
    if (!id) return;
    setViewRowId(String(id));
    setViewOpen(true);
  };

  return (
    <>
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
              hiddenColumns={[]}
              cursorRowSelect
              allowExportData={true}
              onViewRowId={handleViewRow}
            />
          )}
        </CardContent>
      </Card>

      {/* View dialog */}
      <ReadyCheckViewDialog
        viewRowId={viewRowId}
        open={viewOpen}
        onOpenChange={(open) => {
          setViewOpen(open);
          if (!open) {
            // clear selected id when dialog closes
            setViewRowId(null);
          }
        }}
      />
    </>
  );
}

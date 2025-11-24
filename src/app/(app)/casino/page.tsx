"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Plus, TriangleAlert } from "lucide-react";

// Import your DataTable and column definition (create these for casino groups!)
import { DataTable } from "@/components/table/data-table";
import { CasinoGroupFormDialog } from "./(components)/CasinoGroupFormDialog";
import { useCasinoGroup } from "@/lib/hooks/swr/casino-group/useCasinoGroup";
import { casinoGroupColumns } from "@/components/table/casino/casinoGroupColumn";
import { useSession } from "next-auth/react";
import { ADMINROLES } from "@/lib/types/role";
import { CasinoGroupEditDialog } from "./(components)/CasinoGroupEditDialog";

export default function CasinoGroupsPage() {
  const [open, setOpen] = useState(false);
  const { data: session } = useSession();
  const [casinoRowId, setCasinoRowId] = useState<string>("");
  const [editOpen, setEditOpen] = useState(false);
  const { casinoGroupData, casinoGroupError, casinoGroupLoading } =
    useCasinoGroup();

  // Customize columns to hide if needed
  const hiddenColumns: string[] = [];
  console.log("session:", session);
  return (
    <Card>
      <CardContent>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Casino Groups</h1>

          {session?.user?.role === ADMINROLES.ADMIN ||
          session?.user?.role === ADMINROLES.SUPERADMIN ? (
            <div className="flex flex-row gap-2 items-center">
              {casinoGroupError && <TriangleAlert className="text-red-500" />}
              <Button onClick={() => setOpen(true)}>
                <Plus />
                Add Casino Group
              </Button>
            </div>
          ) : null}
        </div>

        {/* Table/List */}
        {casinoGroupLoading ? (
          <div className="w-full flex flex-col gap-2 items-center">
            <Skeleton className="w-full h-10" />
            <Skeleton className="w-full h-40" />
          </div>
        ) : (
          <DataTable
            data={casinoGroupData}
            columns={casinoGroupColumns}
            allowSelectRow={false}
            hiddenColumns={hiddenColumns}
            cursorRowSelect
            allowExportData={true}
            onViewRowId={(id) => {
              setCasinoRowId(id);
              setEditOpen(true);
            }}
          />
        )}
      </CardContent>

      {/* Create Casino Group Dialog */}
      <CasinoGroupFormDialog open={open} onOpenChange={() => setOpen(!open)} />
      <CasinoGroupEditDialog
        open={editOpen}
        onOpenChange={() => setEditOpen(!editOpen)}
        casinoRowId={casinoRowId}
      />
    </Card>
  );
}

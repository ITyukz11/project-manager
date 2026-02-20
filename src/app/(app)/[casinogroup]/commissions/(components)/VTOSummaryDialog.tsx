"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, MoveRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { roleStyles, roleStylesText } from "./getBadgeColor";
import { DataTable } from "@/components/table/data-table";
import { getVtoColumns } from "./vto-columns";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useVtoListById } from "./useVtoListById";
import { useCommissionByUserName } from "./useVTOWithdrawHistoryByUsername";
import { withdrawHistoryColumns } from "./commission-columns";
// 🔜 create this hook later
// import { useWithdrawalListById } from "./useWithdrawalListById";

type VTOSummaryDialogProps = {
  userName: string | null;
  userRole: string | null;
  open: boolean;
  onClose: () => void;
};

export function VTOSummaryDialog({
  open,
  onClose,
  userName,
  userRole,
}: VTOSummaryDialogProps) {
  const { vtos, isLoading: isVtoLoading } = useVtoListById(
    userName,
    open,
    false,
  );
  const { commissions, isLoading: isCommissionLoading } =
    useCommissionByUserName(userName, open);

  const parentChain = React.useMemo(
    () => [...(vtos[0]?.parentChain ?? [])].reverse(),
    [vtos],
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="
          w-full
          px-0
          sm:px-6
          sm:rounded-lg
          sm:max-w-[95vw]
        "
      >
        <DialogHeader>
          <DialogTitle>VTO Summary</DialogTitle>

          {/* 🔗 PARENT CHAIN */}
          <div className="flex flex-row gap-2 flex-wrap">
            {parentChain.map((parent) => (
              <div key={parent.id} className="flex flex-row items-start">
                <div className="flex flex-col">
                  <span className={roleStylesText[parent.role]}>
                    {parent.userName}
                  </span>

                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs font-semibold px-2.5 py-1",
                      roleStyles[parent.role],
                    )}
                  >
                    {parent.role}
                  </Badge>
                </div>
                <MoveRightIcon />
              </div>
            ))}

            <div className="flex flex-col">
              <span className={roleStylesText[userRole || ""]}>
                {userName || "Unknown User"}
              </span>

              <Badge
                variant="outline"
                className={cn(
                  "text-xs font-semibold px-2.5 py-1",
                  roleStyles[userRole || ""],
                )}
              >
                {userRole || "Unknown Role"}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        {/* ============================= */}
        {/* 🔥 TABS HERE (after header) */}
        {/* ============================= */}
        <Tabs defaultValue="claim">
          <TabsList>
            <TabsTrigger value="claim">Claim History</TabsTrigger>
            <TabsTrigger value="withdrawal">Withdrawal History</TabsTrigger>
          </TabsList>

          {/* ============================= */}
          {/* 🧾 CLAIM HISTORY */}
          {/* ============================= */}
          <TabsContent value="claim">
            <div className="max-h-[65vh] overflow-y-auto no-scrollbar">
              <DataTable
                columns={getVtoColumns()}
                data={vtos}
                isLoading={isVtoLoading}
                hiddenColumns={[]}
              />
            </div>
          </TabsContent>

          {/* ============================= */}
          {/* 💸 WITHDRAWAL HISTORY */}
          {/* ============================= */}
          <TabsContent value="withdrawal">
            <div className="max-h-[65vh] overflow-y-auto no-scrollbar">
              <DataTable
                columns={withdrawHistoryColumns({ onViewThread: () => {} })}
                data={commissions}
                isLoading={isCommissionLoading}
                hiddenColumns={[]}
              />
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="px-6 pb-4">
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

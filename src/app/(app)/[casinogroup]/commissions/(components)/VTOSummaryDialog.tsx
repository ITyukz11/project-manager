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
import { useVtoListById } from "./useVtoListById";

type VTOSummaryDialogProps = {
  userName: string | null;
  userRole: string | null;
  open: boolean;
  onClose: () => void;
  admin?: boolean;
};

export function VTOSummaryDialog({
  open,
  onClose,
  userName,
  userRole,
}: VTOSummaryDialogProps) {
  // Use the SWR hook

  const { vtos, isLoading } = useVtoListById(
    userName,
    open, // enable only when userName exists
    false, // false = show ALL (claimed + unclaimed)
  );

  console.log("VTOSummaryDialog vtos:", vtos);
  console.log("VTOSummaryDialog userName:", userName);

  const parentChain = React.useMemo(
    () => [...(vtos[0]?.parentChain ?? [])].reverse(),
    [vtos],
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="
          w-full
          max-w-5xl
          sm:max-w-2xl
          px-0
          sm:px-6
          sm:rounded-lg
          md:max-w-4xl
          lg:max-w-5xl
        "
      >
        <DialogHeader>
          <DialogTitle>VTO Summary</DialogTitle>
          <div className="flex flex-row gap-2">
            <div className="flex flex-row justify-start gap-2 flex-wrap">
              {parentChain.map((parent) => (
                <div
                  key={parent.id}
                  className="flex flex-row justify-start items-start"
                >
                  <div
                    key={parent.id}
                    className="flex flex-col justify-start items-start"
                  >
                    {parent.userName && (
                      <span className={roleStylesText[parent.role]}>
                        {parent.userName}
                      </span>
                    )}

                    <Badge
                      variant="outline"
                      className={cn(
                        "whitespace-nowrap font-semibold text-xs px-2.5 py-1",
                        roleStyles[parent.role],
                      )}
                    >
                      {parent.role}
                    </Badge>
                  </div>

                  <MoveRightIcon />
                </div>
              ))}
              <div className="flex flex-col justify-start items-start">
                {userName ? (
                  <span className={roleStylesText[userRole || ""]}>
                    {userName}
                  </span>
                ) : (
                  "Unknown User"
                )}
                {userRole ? (
                  <Badge
                    variant="outline"
                    className={cn(
                      "whitespace-nowrap font-semibold text-xs px-2.5 py-1",
                      roleStyles[userRole], // No backticks needed here
                    )}
                  >
                    {userRole}
                  </Badge>
                ) : (
                  "Unknown Role"
                )}
              </div>
            </div>
          </div>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="animate-spin h-6 w-6 text-muted-foreground" />
            </div>
          ) : vtos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No VTO Summary.
            </div>
          ) : (
            <DataTable
              columns={getVtoColumns()}
              data={vtos}
              hiddenColumns={[
                "totalBet",
                "totalWin",
                "totalWinLoss",
                "betCount",
                "type",
                "commissionType",
                "winLoss",
              ]}
            />
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState } from "react";
import { MoreHorizontal, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useTransactionRequest } from "@/lib/hooks/swr/transaction-request/useTransactionRequest";
import { useParams } from "next/navigation";

interface TransactionRequestActionMenuProps {
  transactionId: string;
}

export function TransactionRequestActionMenu({
  transactionId,
}: TransactionRequestActionMenuProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [actionType, setActionType] = useState<"APPROVED" | "REJECTED" | null>(
    null
  );
  const [remarks, setRemarks] = useState("");
  const params = useParams();
  const casinoGroup = params.casinogroup;

  const { mutate } = useTransactionRequest(casinoGroup?.toLocaleString() || "");

  const openConfirmDialog = (status: "APPROVED" | "REJECTED") => {
    setActionType(status);
    setRemarks("");
    setIsDialogOpen(true);
  };

  const handleStatusUpdate = async () => {
    if (!actionType) return;

    setIsUpdating(true);

    try {
      const response = await fetch(
        `/api/transaction-request/${transactionId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: actionType,
            remarks: remarks.trim() || "",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update status");
      }

      toast.success(`Transaction ${actionType.toLowerCase()} successfully`);
      mutate();
      setIsDialogOpen(false);
      setRemarks("");
      setActionType(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to update transaction");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    setIsDialogOpen(false);
    setRemarks("");
    setActionType(null);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => openConfirmDialog("APPROVED")}>
            <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
            Approve
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => openConfirmDialog("REJECTED")}>
            <XCircle className="mr-2 h-4 w-4 text-red-600" />
            Reject
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex flex-row">
              {actionType === "APPROVED" ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                  Approve Transaction
                </>
              ) : (
                <>
                  <XCircle className="mr-2 h-4 w-4 text-red-600" />
                  Reject Transaction
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {actionType === "APPROVED"
                ? "You are about to approve this transaction"
                : "You are about to reject this transaction"}
            </DialogDescription>
          </DialogHeader>

          <div className="">
            <div className="space-y-2">
              <Label htmlFor="remarks">
                Remarks{" "}
                <span className="text-muted-foreground text-xs">
                  (Optional)
                </span>
              </Label>
              <Textarea
                id="remarks"
                placeholder="Add any remarks or notes..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              variant={actionType === "APPROVED" ? "default" : "destructive"}
              onClick={handleStatusUpdate}
              disabled={isUpdating}
            >
              {isUpdating
                ? "Processing..."
                : actionType === "APPROVED"
                ? "Approve"
                : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

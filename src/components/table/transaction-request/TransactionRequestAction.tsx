"use client";

import { useState } from "react";
import { MoreHorizontal, Eye, CheckCircle, XCircle } from "lucide-react";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface TransactionRequestActionMenuProps {
  transactionId: string;
}

export function TransactionRequestActionMenu({
  transactionId,
}: TransactionRequestActionMenuProps) {
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusUpdate = async (status: "COMPLETED" | "REJECTED") => {
    setIsUpdating(true);

    try {
      const response = await fetch(
        `/api/transaction-request/${transactionId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update status");
      }

      toast.success(`Transaction ${status.toLowerCase()} successfully`);
      router.refresh();
      setIsDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to update transaction");
    } finally {
      setIsUpdating(false);
    }
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
          <DropdownMenuItem onClick={() => setIsDialogOpen(true)}>
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleStatusUpdate("COMPLETED")}>
            <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
            Mark as Completed
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleStatusUpdate("REJECTED")}>
            <XCircle className="mr-2 h-4 w-4 text-red-600" />
            Mark as Rejected
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
            <DialogDescription>
              View full transaction information
            </DialogDescription>
          </DialogHeader>
          {/* Add transaction details view here */}
          <p className="text-sm text-muted-foreground">
            Transaction ID: {transactionId}
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}

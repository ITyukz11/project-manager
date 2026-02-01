"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertCircle,
  Calendar,
  User,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  CheckCircle,
  Loader2,
  Lock,
  TextAlignStart,
  Building,
  ImageIcon,
  Trash2,
  Coins,
} from "lucide-react";
import { formatDate } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";

import { toast } from "sonner";
import { getStatusColorClass } from "@/components/getStatusColorClass";
import { useCommissionDetailsById } from "@/lib/hooks/swr/commission/details/useCommissionDetails";
import { formatPhpAmount } from "@/components/formatAmount";
import { useParams } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";

interface CommissionDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  commissionId: string | null;
  refetch: () => void;
}

// Skeleton Loading Component
function CommissionDetailsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-2 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-24" />
          </div>
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="text-right space-y-1 w-full sm:w-auto">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-3 w-16 ml-auto" />
        </div>
      </div>

      <Separator />

      {/* Player & Casino Info Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="pl-6 space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-28" />
          </div>
          <div className="pl-6 space-y-2">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </div>

      <Separator />

      {/* Payment Information Skeleton */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="pl-6 space-y-3">
          <div className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-36" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
      </div>

      <Separator />

      {/* Receipt Skeleton */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="pl-6">
          <Skeleton className="h-9 w-28" />
        </div>
      </div>

      <Separator />

      {/* Timestamps Skeleton */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="pl-6 space-y-3">
          <div className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function CommissionDetailsDialog({
  open,
  onOpenChange,
  commissionId,
  refetch,
}: CommissionDetailsDialogProps) {
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [actionType, setActionType] = useState<"CLAIMED" | "REJECTED" | null>(
    null,
  );
  const [remarks, setRemarks] = useState("");
  const params = useParams().casinogroup;

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // Receipt file states (single file for both upload and paste)
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);

  const { commission, isLoading, error, mutate } =
    useCommissionDetailsById(commissionId);
  // Reset states when dialog opens and refetch data
  useEffect(() => {
    if (open && commissionId) {
      mutate(); // Refetch latest data when dialog opens
    }
  }, [open, commissionId, mutate]);

  const openConfirmDialog = (status: "CLAIMED" | "REJECTED") => {
    setActionType(status);
    setRemarks("");
    setIsActionDialogOpen(true);
  };

  console.log("commission: ", commission);
  const handleStatusUpdate = async () => {
    if (!actionType || !commissionId || !commission) return;

    setIsUpdating(true);

    try {
      const formData = new FormData();
      formData.append("userName", commission.userName);
      formData.append("externalUserId", commission.externalUserId || "");
      formData.append("amount", commission.amount.toString());
      // formData.append("casinoGroup", commission.casinoGroup.name);
      formData.append("status", actionType);

      if (receiptFile) {
        formData.append("attachment", receiptFile);
      }
      if (remarks.trim()) {
        formData.append("remarks", remarks.trim());
      }

      const details =
        commission.details +
        (remarks.trim() ? `\n\nRemarks: ${remarks.trim()}` : "");

      formData.append("details", details);

      let response: Response;
      let data: any;

      if (actionType === "CLAIMED") {
        response = await fetch(`/api/commission/${commissionId}/claim`, {
          method: "POST",
          body: formData,
        });

        data = await response.json();

        if (!response.ok) {
          toast.error(data?.error || "Claim failed");
          return;
        }

        toast.success("Claimed and requested a cashout successfully!");
      } else {
        response = await fetch(`/api/commission/${commissionId}/reject`, {
          method: "PATCH",
          body: formData,
        });

        data = await response.json();

        if (!response.ok) {
          toast.error(
            data?.error || `Failed to ${actionType.toLowerCase()} commission`,
          );
          return;
        }

        toast.success(`Commission ${actionType} successfully!`);
      }
      await refetch();
      await mutate();

      setIsActionDialogOpen(false);
      setRemarks("");
      setActionType(null);
    } catch (error: any) {
      toast.error(error?.message || "Failed to update commission");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    setIsActionDialogOpen(false);
    setRemarks("");
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "CLAIMED":
      case "COMPLETED":
        return <CheckCircle2 className="h-4 w-4" />;
      case "REJECTED":
        return <XCircle className="h-4 w-4" />;
      case "PENDING":
        return <Clock className="h-4 w-4" />;
      case "COMMISSION":
        return <Coins className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusBadgeVariant = (status?: string) => {
    switch (status) {
      case "CLAIMED":
      case "COMPLETED":
        return "success";
      case "REJECTED":
        return "destructive";
      case "PENDING":
        return "default";
      case "COMMISSION":
        return "default";
      default:
        return "secondary";
    }
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      // Check if the pasted item is an image
      if (item.type.startsWith("image/")) {
        e.preventDefault(); // Prevent default paste behavior

        const file = item.getAsFile();
        if (!file) continue;

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast.error("Image size must be less than 5MB");
          return;
        }

        // Create a new file with a proper name
        const timestamp = new Date().getTime();
        const renamedFile = new File(
          [file],
          `pasted-receipt-${timestamp}.${file.type.split("/")[1]}`,
          { type: file.type },
        );

        // Replace existing receipt
        setReceiptFile(renamedFile);

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
          setReceiptPreview(reader.result as string);
        };
        reader.readAsDataURL(renamedFile);

        toast.success("Image pasted as receipt");
        return; // Only handle the first image
      }
    }
  };

  const removeReceipt = () => {
    setReceiptFile(null);
    setReceiptPreview(null);
    toast.info("Receipt removed");
  };
  const isPending = commission?.status === "PENDING";
  console.log("commission: ", commission);
  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
          <DialogHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Gateway Commission Details
                </DialogTitle>
                <DialogDescription>
                  Detailed information about the request
                </DialogDescription>
              </div>

              {/* Action Buttons */}
              {isPending && !isLoading && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-green-600 hover:text-green-700 border-green-600 hover:bg-green-50 dark:hover:bg-green-950"
                    onClick={() => openConfirmDialog("CLAIMED")}
                  >
                    <CheckCircle className="h-4 w-4" />
                    Claim
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 hover:text-red-700 border-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                    onClick={() => openConfirmDialog("REJECTED")}
                  >
                    <XCircle className="h-4 w-4" />
                    Reject
                  </Button>
                </div>
              )}
            </div>
          </DialogHeader>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                {error ||
                  "Error loading commission details. Please try again later."}
              </AlertDescription>
            </Alert>
          )}

          <ScrollArea className="flex-1 pr-4">
            {isLoading ? (
              <CommissionDetailsSkeleton />
            ) : commission ? (
              <div className="space-y-6">
                {/* Header Info */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant={
                          getStatusBadgeVariant(commission?.status) as any
                        }
                        className={getStatusColorClass("COMMISSION")}
                      >
                        {getStatusIcon("COMMISSION")}
                        COMMISSION
                      </Badge>

                      <Badge
                        variant={
                          getStatusBadgeVariant(commission?.status) as any
                        }
                        className={getStatusColorClass(commission?.status)}
                      >
                        {getStatusIcon(commission?.status)}
                        {commission?.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono break-all flex items-center gap-1">
                      ID: {commission?.id} <Lock size={10} />
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-2xl font-bold text-foreground">
                      {formatPhpAmount(commission?.amount)}
                    </p>
                    <p className="text-xs text-muted-foreground">Amount</p>
                  </div>
                </div>

                <Separator />

                {/* User & Casino Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <User className="h-4 w-4 text-muted-foreground" />
                      User Information
                    </div>
                    <div className="pl-6 space-y-1">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Username
                        </p>
                        <p className="text-sm font-medium break-all">
                          {commission?.userName}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      Casino Group
                    </div>
                    <div className="pl-6 space-y-1">
                      <div>
                        <p className="text-xs text-muted-foreground">Name</p>
                        <p className="text-sm font-medium break-all">
                          {params}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Details */}
                {commission?.details && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <TextAlignStart className="h-4 w-4 text-muted-foreground" />
                        Details
                      </div>
                      <div className="pl-6">
                        <p className="text-sm bg-muted p-3 rounded whitespace-pre-wrap break-all">
                          {commission?.details}
                        </p>
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                {/* Timestamps */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    Timestamps
                  </div>
                  <div className="pl-6 space-y-1">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Created At
                      </p>
                      <p className="text-sm font-medium">
                        {commission &&
                          formatDate(
                            new Date(commission.createdAt || ""),
                            "MMM dd, yyyy - h:mm:ss aa",
                          )}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Updated At
                      </p>
                      <p className="text-sm font-medium">
                        {commission &&
                          formatDate(
                            new Date(commission.updatedAt || ""),
                            "MMM dd, yyyy - h:mm:ss aa",
                          )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Claim/Reject Confirmation Dialog */}
      <Dialog open={isActionDialogOpen} onOpenChange={setIsActionDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex flex-row items-center">
              {actionType === "CLAIMED" ? (
                <>
                  <CheckCircle className="mr-2 h-5 w-5 text-green-600" />
                  Claim Chips
                </>
              ) : (
                <>
                  <XCircle className="mr-2 h-5 w-5 text-red-600" />
                  Reject Commission
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {actionType === "CLAIMED"
                ? "You are about to claim this commission"
                : "You are about to reject this commission"}
            </DialogDescription>
          </DialogHeader>

          {/* Warning for cashout without receipt */}

          <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />

            <AlertDescription className="text-sm text-blue-900 dark:text-blue-100">
              Please double check before taking action
            </AlertDescription>
          </Alert>
          {actionType === "REJECTED" && (
            <div className="space-y-2">
              <Label htmlFor="remarks">
                Reason
                <span className="text-muted-foreground text-xs">
                  (Optional)
                </span>
              </Label>
              <Textarea
                ref={textareaRef}
                id="remarks"
                placeholder="Add any reason..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                onPaste={handlePaste}
                rows={4}
                className="resize-none"
              />

              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <ImageIcon className="h-3 w-3" />
                <span>
                  Tip: You can paste image here (Ctrl+V) as receipt (max 5MB)
                </span>
              </div>
              <div className="space-y-2">
                {receiptPreview && (
                  <div>
                    <div className="overflow-hidden w-fit relative bg-muted rounded-lg border">
                      <Image
                        src={receiptPreview}
                        alt="Receipt Preview"
                        width={100}
                        height={100}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0 relative">
                        <p className="text-xs text-muted-foreground truncate">
                          {receiptFile?.name}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={removeReceipt}
                        className="text-destructive hover:text-destructive ml-2"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row sm: justify-end gap-2">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isUpdating}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              variant={actionType === "CLAIMED" ? "default" : "destructive"}
              onClick={handleStatusUpdate}
              disabled={isUpdating}
              className="w-full sm:w-auto"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : actionType === "CLAIMED" ? (
                "Claim"
              ) : (
                "Reject"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

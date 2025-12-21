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
  CreditCard,
  User,
  Building,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Receipt,
  CheckCircle,
  Loader2,
  Trash2,
  Image as ImageIcon,
  Lock,
} from "lucide-react";
import { formatDate } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import { useTransactionDetails } from "@/lib/hooks/swr/transaction-request/details/useTransactionDetails";
import { useTransactionRequest } from "@/lib/hooks/swr/transaction-request/useTransactionRequest";
import { useParams } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import Image from "next/image";

interface TransactionDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactionId: string | null;
}

// Skeleton Loading Component
function TransactionDetailsSkeleton() {
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

export function TransactionDetailsDialog({
  open,
  onOpenChange,
  transactionId,
}: TransactionDetailsDialogProps) {
  const [showReceipt, setShowReceipt] = useState(true);
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [actionType, setActionType] = useState<"APPROVED" | "REJECTED" | null>(
    null
  );
  const [remarks, setRemarks] = useState("");

  // Receipt file states (single file for both upload and paste)
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [receiptSource, setReceiptSource] = useState<"upload" | "paste" | null>(
    null
  );

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const params = useParams();
  const casinoGroup = params.casinogroup;

  const { transaction, isLoading, error, mutate } =
    useTransactionDetails(transactionId);

  const { refetch: mutateList } = useTransactionRequest(
    casinoGroup?.toString() || ""
  );

  // Reset states when dialog opens and refetch data
  useEffect(() => {
    if (open && transactionId) {
      setReceiptFile(null);
      setReceiptPreview(null);
      setReceiptSource(null);
      mutate(); // Refetch latest data when dialog opens
    }
  }, [open, transactionId, mutate]);

  const openConfirmDialog = (status: "APPROVED" | "REJECTED") => {
    setActionType(status);
    setRemarks("");
    setReceiptFile(null);
    setReceiptPreview(null);
    setReceiptSource(null);
    setIsActionDialogOpen(true);
  };

  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }

      setReceiptFile(file);
      setReceiptSource("upload");

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      toast.success("Receipt uploaded successfully");
    }
  };

  const removeReceipt = () => {
    setReceiptFile(null);
    setReceiptPreview(null);
    setReceiptSource(null);
    toast.info("Receipt removed");
  };

  // Handle paste event in textarea
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
          { type: file.type }
        );

        // Replace existing receipt
        setReceiptFile(renamedFile);
        setReceiptSource("paste");

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

  const handleStatusUpdate = async () => {
    if (!actionType || !transactionId) return;

    // Check if it's a cashout approval and receipt is required
    if (
      actionType === "APPROVED" &&
      transaction?.type === "CASHOUT" &&
      !transaction?.receiptUrl &&
      !receiptFile
    ) {
      toast.error("Please upload the receipt before approving");
      return;
    }

    setIsUpdating(true);

    try {
      const formData = new FormData();
      formData.append("status", actionType);

      if (remarks.trim()) {
        formData.append("remarks", remarks.trim());
      }

      // Add receipt file if it exists
      if (receiptFile) {
        formData.append("receipt", receiptFile);
      }

      const response = await fetch(
        `/api/transaction-request/${transactionId}`,
        {
          method: "PATCH",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update status");
      }

      toast.success(`Transaction ${actionType.toLowerCase()} successfully`);
      mutate(); // Refresh transaction details
      mutateList(); // Refresh transaction list
      setIsActionDialogOpen(false);
      setRemarks("");
      setActionType(null);
      setReceiptFile(null);
      setReceiptPreview(null);
      setReceiptSource(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to update transaction");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    setIsActionDialogOpen(false);
    setRemarks("");
    setActionType(null);
    setReceiptFile(null);
    setReceiptPreview(null);
    setReceiptSource(null);
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "APPROVED":
      case "COMPLETED":
        return <CheckCircle2 className="h-4 w-4" />;
      case "REJECTED":
        return <XCircle className="h-4 w-4" />;
      case "PENDING":
        return <Clock className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusBadgeVariant = (status?: string) => {
    switch (status) {
      case "APPROVED":
      case "COMPLETED":
        return "success";
      case "REJECTED":
        return "destructive";
      case "PENDING":
        return "default";
      default:
        return "secondary";
    }
  };

  const getTypeBadgeVariant = (type?: string) => {
    return type === "CASHIN" ? "default" : "secondary";
  };

  const isPending = transaction?.status === "PENDING";
  const isCashout = transaction?.type === "CASHOUT";

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
          <DialogHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Transaction Details
                </DialogTitle>
                <DialogDescription>
                  Detailed information about the transaction request
                </DialogDescription>
              </div>

              {/* Action Buttons */}
              {isPending && !isLoading && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-green-600 border-green-600 hover:bg-green-50 dark:hover:bg-green-950"
                    onClick={() => openConfirmDialog("APPROVED")}
                  >
                    <CheckCircle className="h-4 w-4" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-950"
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
                  "Error loading transaction details. Please try again later."}
              </AlertDescription>
            </Alert>
          )}

          <ScrollArea className="flex-1 pr-4">
            {isLoading ? (
              <TransactionDetailsSkeleton />
            ) : transaction ? (
              <div className="space-y-6">
                {/* Header Info */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={getTypeBadgeVariant(transaction?.type)}>
                        {transaction?.type}
                      </Badge>
                      <Badge
                        variant={
                          getStatusBadgeVariant(transaction?.status) as any
                        }
                        className={`flex items-center gap-1 ${
                          transaction?.status === "PENDING"
                            ? "bg-yellow-600 hover:bg-yellow-700 text-white"
                            : transaction?.status === "APPROVED"
                            ? "bg-green-600 hover:bg-green-700 text-white"
                            : ""
                        }`}
                      >
                        {getStatusIcon(transaction?.status)}
                        {transaction?.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono break-all flex items-center gap-1">
                      ID: {transaction?.id} <Lock size={10} />
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-2xl font-bold text-foreground">
                      ₱{transaction?.amount.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">Amount</p>
                  </div>
                </div>

                <Separator />

                {/* Player & Casino Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <User className="h-4 w-4 text-muted-foreground" />
                      Player Information
                    </div>
                    <div className="pl-6 space-y-1">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Username
                        </p>
                        <p className="text-sm font-medium break-all">
                          {transaction?.username}
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
                          {transaction?.casinoGroup.name}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Payment Information */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    Payment Information
                  </div>
                  <div className="pl-6 space-y-3">
                    {transaction?.paymentMethod && (
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Payment Method
                        </p>
                        <p className="text-sm font-medium">
                          {transaction?.paymentMethod}
                        </p>
                      </div>
                    )}

                    {transaction?.type === "CASHOUT" && (
                      <>
                        {transaction?.bankName && (
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Bank Name
                            </p>
                            <p className="text-sm font-medium">
                              {transaction?.bankName}
                            </p>
                          </div>
                        )}
                        {transaction?.accountName && (
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Account Name
                            </p>
                            <p className="text-sm font-medium break-all">
                              {transaction?.accountName}
                            </p>
                          </div>
                        )}
                        {transaction?.accountNumber && (
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Account Number
                            </p>
                            <p className="text-sm font-medium font-mono break-all">
                              {transaction?.accountNumber}
                            </p>
                          </div>
                        )}
                        {transaction?.bankDetails && (
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Bank Details
                            </p>
                            <p className="text-sm font-medium whitespace-pre-wrap bg-muted p-2 rounded break-all">
                              {transaction?.bankDetails}
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Receipt Section */}
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Receipt className="h-4 w-4 text-muted-foreground" />
                    Receipt
                  </div>
                  <div className="pl-6">
                    {transaction?.receiptUrl ? (
                      !showReceipt ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowReceipt(true)}
                        >
                          View Receipt
                        </Button>
                      ) : (
                        <div className="relative w-full h-64 bg-muted rounded-lg border group">
                          <Image
                            src={transaction?.receiptUrl}
                            alt="Transaction Receipt"
                            width={200}
                            height={400}
                            className="object-contain rounded-lg w-full h-full cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => {
                              if (transaction?.receiptUrl) {
                                window.open(transaction.receiptUrl, "_blank");
                              }
                            }}
                            title="Click to open in new tab"
                          />
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => setShowReceipt(false)}
                            title="Close receipt"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      )
                    ) : (
                      <div className="flex items-center gap-2">
                        <p
                          className={`text-sm ${
                            isCashout
                              ? "text-orange-600 dark:text-orange-400 font-medium"
                              : "text-muted-foreground"
                          }`}
                        >
                          {isCashout
                            ? "⚠️ No receipt uploaded yet"
                            : "No receipt available"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Remarks */}
                {transaction?.remarks && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        Remarks
                      </div>
                      <div className="pl-6">
                        <p className="text-sm bg-muted p-3 rounded whitespace-pre-wrap break-all">
                          {transaction?.remarks}
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {/* Processing Information */}
                {transaction?.processedBy && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <User className="h-4 w-4 text-muted-foreground" />
                        Processed By
                      </div>
                      <div className="pl-6 space-y-1">
                        <div>
                          <p className="text-xs text-muted-foreground">Name</p>
                          <p className="text-sm font-medium break-all">
                            {transaction?.processedBy.name}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Username
                          </p>
                          <p className="text-sm font-medium break-all">
                            {transaction?.processedBy.username}
                          </p>
                        </div>
                        {transaction?.processedAt && (
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Processed At
                            </p>
                            <p className="text-sm font-medium">
                              {formatDate(
                                new Date(transaction.processedAt),
                                "MMM dd, yyyy HH:mm: ss"
                              )}
                            </p>
                          </div>
                        )}
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
                        {transaction &&
                          formatDate(
                            new Date(transaction.createdAt || ""),
                            "MMM dd, yyyy - h:mm:aa"
                          )}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Updated At
                      </p>
                      <p className="text-sm font-medium">
                        {transaction &&
                          formatDate(
                            new Date(transaction.updatedAt || ""),
                            "MMM dd, yyyy - h:mm:aa"
                          )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Audit Trail (if available) */}
                {(transaction?.ipAddress || transaction?.userAgent) && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                        Audit Trail
                      </div>
                      <div className="pl-6 space-y-1">
                        {transaction?.ipAddress && (
                          <div>
                            <p className="text-xs text-muted-foreground">
                              IP Address
                            </p>
                            <p className="text-sm font-medium font-mono break-all">
                              {transaction?.ipAddress}
                            </p>
                          </div>
                        )}
                        {transaction?.userAgent && (
                          <div>
                            <p className="text-xs text-muted-foreground">
                              User Agent
                            </p>
                            <p className="text-xs font-medium text-muted-foreground break-all">
                              {transaction?.userAgent}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : null}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Approve/Reject Confirmation Dialog */}
      <Dialog open={isActionDialogOpen} onOpenChange={setIsActionDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex flex-row items-center">
              {actionType === "APPROVED" ? (
                <>
                  <CheckCircle className="mr-2 h-5 w-5 text-green-600" />
                  Approve Transaction
                </>
              ) : (
                <>
                  <XCircle className="mr-2 h-5 w-5 text-red-600" />
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

          {/* Warning for cashout without receipt */}
          {actionType === "APPROVED" &&
            transaction?.type === "CASHOUT" &&
            !transaction?.receiptUrl &&
            !receiptFile && (
              <Alert className="bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                <AlertDescription className="text-sm text-red-900 dark:text-red-100">
                  Please upload receipt before approving this cashout
                </AlertDescription>
              </Alert>
            )}

          {/* Receipt Upload for Cashout */}
          {transaction?.type === "CASHOUT" && !transaction?.receiptUrl && (
            <div className="space-y-2">
              <Label htmlFor="receipt">
                Receipt <span className="text-destructive">*</span>
              </Label>

              {!receiptPreview ? (
                <div className="space-y-2">
                  <Input
                    id="receipt"
                    type="file"
                    accept="image/*"
                    onChange={handleReceiptChange}
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <ImageIcon className="h-3 w-3" />
                    Upload receipt or paste image in remarks field (max 5MB)
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative w-full h-40 bg-muted rounded-lg border">
                    <Image
                      src={receiptPreview}
                      alt="Receipt Preview"
                      width={100}
                      height={100}
                      objectFit="cover"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground truncate">
                        {receiptFile?.name}
                      </p>
                      {receiptSource && (
                        <p className="text-xs text-muted-foreground">
                          Source:{" "}
                          {receiptSource === "upload"
                            ? "📁 Upload"
                            : "📋 Pasted"}
                        </p>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={removeReceipt}
                      className="text-destructive hover:text-destructive ml-2"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="remarks">
              Remarks{" "}
              <span className="text-muted-foreground text-xs">(Optional)</span>
            </Label>
            <Textarea
              ref={textareaRef}
              id="remarks"
              placeholder="Add any remarks or notes..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              onPaste={handlePaste}
              rows={4}
              className="resize-none"
            />
            {transaction?.type === "CASHOUT" &&
              !transaction?.receiptUrl &&
              !receiptFile && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <ImageIcon className="h-3 w-3" />
                  <span>Tip: You can paste image here (Ctrl+V) as receipt</span>
                </div>
              )}
          </div>

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
              variant={actionType === "APPROVED" ? "default" : "destructive"}
              onClick={handleStatusUpdate}
              disabled={isUpdating}
              className="w-full sm:w-auto"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : actionType === "APPROVED" ? (
                "Approve"
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

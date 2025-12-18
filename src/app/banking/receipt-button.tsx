"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Eye, FileImage } from "lucide-react";
import { ReceiptViewer } from "./receipt-viewer";

interface ReceiptButtonProps {
  receiptUrl: string;
  transactionId?: string;
  variant?: "link" | "button" | "icon";
  className?: string;
}

export function ReceiptButton({
  receiptUrl,
  transactionId,
  variant = "link",
  className,
}: ReceiptButtonProps) {
  const [showViewer, setShowViewer] = useState(false);

  if (variant === "link") {
    return (
      <>
        <button
          onClick={() => setShowViewer(true)}
          className={`text-primary hover:underline text-xs cursor-pointer ${
            className || ""
          }`}
        >
          View Receipt
        </button>
        <ReceiptViewer
          receiptUrl={receiptUrl}
          transactionId={transactionId}
          isOpen={showViewer}
          onClose={() => setShowViewer(false)}
        />
      </>
    );
  }

  if (variant === "icon") {
    return (
      <>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowViewer(true)}
          className={className}
        >
          <Eye className="h-4 w-4" />
        </Button>
        <ReceiptViewer
          receiptUrl={receiptUrl}
          transactionId={transactionId}
          isOpen={showViewer}
          onClose={() => setShowViewer(false)}
        />
      </>
    );
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowViewer(true)}
        className={className}
      >
        <FileImage className="mr-2 h-4 w-4" />
        View Receipt
      </Button>
      <ReceiptViewer
        receiptUrl={receiptUrl}
        transactionId={transactionId}
        isOpen={showViewer}
        onClose={() => setShowViewer(false)}
      />
    </>
  );
}

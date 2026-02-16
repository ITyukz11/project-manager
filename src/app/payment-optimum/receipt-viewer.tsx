"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, ZoomIn, ZoomOut, X } from "lucide-react";
import { toast } from "sonner";

interface ReceiptViewerProps {
  receiptUrl: string;
  transactionId?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ReceiptViewer({
  receiptUrl,
  transactionId,
  isOpen,
  onClose,
}: ReceiptViewerProps) {
  const [zoom, setZoom] = useState(100);
  const [isImageLoading, setIsImageLoading] = useState(true);

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 25, 50));
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(receiptUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `receipt-${transactionId || Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Receipt downloaded successfully");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download receipt");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Payment Receipt</span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handleZoomOut}
                disabled={zoom <= 50}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm font-normal min-w-[60px] text-center">
                {zoom}%
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={handleZoomIn}
                disabled={zoom >= 200}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleDownload}>
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="relative overflow-auto max-h-[70vh] bg-muted rounded-lg">
          {isImageLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          )}
          <div
            className="flex items-center justify-center p-4"
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: "top center",
              transition: "transform 0.2s ease-in-out",
            }}
          >
            <Image
              src={receiptUrl}
              alt="Receipt"
              width={500}
              height={500}
              className="rounded-lg shadow-lg"
              onLoad={() => setIsImageLoading(false)}
              onError={() => {
                setIsImageLoading(false);
                toast.error("Failed to load receipt image");
              }}
            />
          </div>
        </div>

        {transactionId && (
          <p className="text-xs text-muted-foreground text-center">
            Transaction ID: {transactionId}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}

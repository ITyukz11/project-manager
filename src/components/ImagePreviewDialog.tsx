"use client";

import { useState } from "react";
import Image from "next/image";
import { ExternalLink } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface ImagePreviewDialogProps {
  open: boolean;
  imageUrl: string | null;
  filename?: string | null;
  onClose: () => void;

  /** Optional handlers if you need strict dialog behavior */
  onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  onInteractOutside?: (e: Event) => void;
  onPointerDownOutside?: (e: Event) => void;
}

export function ImagePreviewDialog({
  open,
  imageUrl,
  filename,
  onClose,
  onKeyDown,
  onInteractOutside,
  onPointerDownOutside,
}: ImagePreviewDialogProps) {
  const [isLoading, setIsLoading] = useState(true);

  if (!imageUrl) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={() => {
        setIsLoading(true); // reset loading when closing/opening
        onClose();
      }}
    >
      <DialogContent
        className="max-w-[90vw] sm:max-w-lg md:max-w-xl"
        onKeyDown={onKeyDown}
        onInteractOutside={onInteractOutside}
        onPointerDownOutside={onPointerDownOutside}
      >
        <DialogHeader>
          <DialogTitle className="text-sm md:text-base truncate">
            {filename || "Image Preview"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {/* Skeleton Loader */}
          {isLoading && (
            <Skeleton className="mx-auto h-[60vh] w-full rounded-lg" />
          )}

          <Image
            src={imageUrl}
            alt={filename || "preview"}
            width={3000}
            height={3000}
            onLoad={() => setIsLoading(false)}
            onError={() => setIsLoading(false)}
            className={`mx-auto block max-h-[60vh] md:max-h-[75vh] w-auto object-contain rounded shadow transition-opacity ${
              isLoading ? "opacity-0" : "opacity-100"
            }`}
          />

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(imageUrl, "_blank")}
              className="flex items-center gap-2"
              disabled={isLoading}
            >
              <ExternalLink className="h-4 w-4" />
              Open in New Tab
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

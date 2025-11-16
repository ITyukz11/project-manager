"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ReactNode, KeyboardEvent } from "react";
import { Spinner } from "./ui/spinner";
import { avoidDefaultDomBehavior } from "@/lib/utils/dialogcontent.utils";

interface CustomFormDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  description?: string;
  content: ReactNode;
  confirmLabel?: string;
  loading?: boolean;
  disableConfirm?: boolean;
  className?: string;
}

const CustomFormDialog = ({
  open,
  onClose,
  onConfirm,
  title,
  className,
  description,
  content,
  confirmLabel = "Submit",
  loading = false,
  disableConfirm = false,
}: CustomFormDialogProps) => {
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (!loading && !disableConfirm) {
        onConfirm();
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className={`sm:max-w-lg ${className}`}
        onPointerDownOutside={avoidDefaultDomBehavior}
        onInteractOutside={avoidDefaultDomBehavior}
        onKeyDown={handleKeyDown}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div className="py-2">{content}</div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={loading || disableConfirm}>
            {loading ? <Spinner /> : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CustomFormDialog;

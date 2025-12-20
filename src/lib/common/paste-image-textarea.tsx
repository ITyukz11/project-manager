// components/common/paste-image-textarea.tsx
"use client";

import * as React from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Image as ImageIcon, XCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PasteImageTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  required?: boolean;
  pastedImages?: File[];
  onPastedImagesChange?: (files: File[]) => void;
  maxFileSize?: number; // in MB
  showPreviews?: boolean;
  previewGridCols?: 2 | 3 | 4;
  textareaClassName?: string;
}

export function PasteImageTextarea({
  label,
  error,
  required = false,
  pastedImages = [],
  onPastedImagesChange,
  maxFileSize = 5,
  showPreviews = true,
  previewGridCols = 3,
  textareaClassName,
  className,
  ...props
}: PasteImageTextareaProps) {
  const [pastedImagePreviews, setPastedImagePreviews] = React.useState<
    string[]
  >([]);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Update previews when pastedImages change
  React.useEffect(() => {
    const generatePreviews = async () => {
      const previews = await Promise.all(
        pastedImages.map((file) => {
          return new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
        })
      );
      setPastedImagePreviews(previews);
    };

    if (pastedImages.length > 0) {
      generatePreviews();
    } else {
      setPastedImagePreviews([]);
    }
  }, [pastedImages]);

  // Handle paste event
  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const newImages: File[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      // Check if the pasted item is an image
      if (item.type.startsWith("image/")) {
        e.preventDefault(); // Prevent default paste behavior

        const file = item.getAsFile();
        if (!file) continue;

        // Validate file size
        const maxSizeInBytes = maxFileSize * 1024 * 1024;
        if (file.size > maxSizeInBytes) {
          toast.error(`Image size must be less than ${maxFileSize}MB`);
          continue;
        }

        // Create a new file with a proper name
        const timestamp = new Date().getTime();
        const renamedFile = new File(
          [file],
          `pasted-image-${timestamp}-${i}.${file.type.split("/")[1]}`,
          { type: file.type }
        );

        newImages.push(renamedFile);
      }
    }

    if (newImages.length > 0) {
      const updatedImages = [...pastedImages, ...newImages];
      onPastedImagesChange?.(updatedImages);
      toast.success(`${newImages.length} image(s) pasted successfully`);
    }
  };

  const removePastedImage = (index: number) => {
    const updatedImages = pastedImages.filter((_, i) => i !== index);
    onPastedImagesChange?.(updatedImages);
    toast.info("Image removed");
  };

  const gridColsClass = {
    2: "grid-cols-2",
    3: "grid-cols-2 sm:grid-cols-3",
    4: "grid-cols-2 sm:grid-cols-4",
  }[previewGridCols];

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}

      <Textarea
        ref={textareaRef}
        onPaste={handlePaste}
        className={cn(textareaClassName)}
        {...props}
      />

      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <ImageIcon className="h-3 w-3" />
        <span>Tip: You can paste images directly (Ctrl+V / Cmd+V)</span>
      </div>

      {error && <p className="text-sm font-medium text-destructive">{error}</p>}

      {/* Display pasted images */}
      {showPreviews && pastedImagePreviews.length > 0 && (
        <div className="space-y-2 pt-2">
          <Label className="text-sm font-semibold">
            Pasted Images ({pastedImagePreviews.length})
          </Label>
          <div className={cn("grid gap-2", gridColsClass)}>
            {pastedImagePreviews.map((preview, index) => (
              <div
                key={index}
                className="relative group h-24 bg-muted rounded-lg border overflow-hidden"
              >
                <img
                  src={preview}
                  alt={`Pasted image ${index + 1}`}
                  className="object-cover w-full h-full"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removePastedImage(index)}
                >
                  <XCircle className="h-3 w-3" />
                </Button>
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs px-2 py-1 truncate">
                  {pastedImages[index]?.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

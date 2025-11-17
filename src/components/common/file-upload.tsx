"use client";

import { useCallback, useEffect, useState } from "react";
import { FileRejection, useDropzone } from "react-dropzone";
import { Upload, X, File } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { usePusher } from "@/lib/hooks/use-pusher";
import { pusherChannel } from "@/lib/pusher";

type UploadProgressData = {
  key: string;
  fileName: string;
  progress: number;
};

type FileWithKey = File & { uploadKey: string };

type FileValueInForm = {
  file: FileWithKey;
  uploadKey: string;
};

type FileUploadProps = {
  title?: string;
  onFilesChange?: (files: FileWithKey[]) => void;
  accept?: Record<string, string[]>;
  maxFiles?: number;
  maxSize?: number;
  className?: string;
  disabled?: boolean;
  value?: FileValueInForm | FileValueInForm[] | null;
};

export function FileUpload({
  title,
  onFilesChange,
  accept = {
    "image/*": [".png", ".jpg", ".jpeg", ".gif"],
    "application/pdf": [".pdf"],
    "text/*": [".txt", ".csv"],
  },
  maxFiles = 5,
  maxSize = 5 * 1024 * 1024, // 5MB
  className,
  disabled = false,
  value,
}: FileUploadProps) {
  const [files, setFiles] = useState<FileWithKey[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, number>>({});
  const [channels, setChannels] = useState<string[]>([]);

  /** Handle incoming Pusher events */
  const onProgress = useCallback((data: UploadProgressData) => {
    setProgressMap((prev) => ({ ...prev, [data.key]: data.progress }));
  }, []);

  /** Subscribe to all active channels */
  usePusher<UploadProgressData>({
    channels,
    eventName: "upload-progress",
    onEvent: onProgress,
  });

  /** Handle accepted files */
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newFilesWithKeys = acceptedFiles.map((file) =>
        Object.assign(file, { uploadKey: crypto.randomUUID() })
      ) as FileWithKey[];

      let updatedFiles: FileWithKey[];

      if (newFilesWithKeys.length >= maxFiles) {
        updatedFiles = newFilesWithKeys.slice(0, maxFiles);
      } else {
        updatedFiles = [...files, ...newFilesWithKeys].slice(0, maxFiles);
      }

      setFiles(updatedFiles);
      onFilesChange?.(updatedFiles);

      // Add new upload channels
      const newChannels = newFilesWithKeys.map((f) =>
        pusherChannel.attachmentProgress(f.uploadKey)
      );
      setChannels((prev) => [...prev, ...newChannels]);
    },
    [files, maxFiles, onFilesChange]
  );

  /** Handle rejected files */
  const onDropRejected = useCallback(
    (fileRejections: FileRejection[]) => {
      fileRejections.forEach(({ file, errors }) => {
        if (!errors?.length) return;
        const fileName = file?.path?.split("/").pop() || "File";

        errors.forEach((error) => {
          let toastTitle = "Upload Failed";
          let toastDescription = `Error with **${fileName}**: ${error.message}`;

          if (error.code === "file-too-large") {
            toastTitle = "File Too Large";
            const maxSizeMB = (maxSize / 1048576).toFixed(0);
            toastDescription = `**${fileName}** is too large. Max size is ${maxSizeMB}MB.`;
          }

          toast.error(toastTitle, { description: toastDescription });
        });
      });
    },
    [maxSize]
  );

  /** Remove file */
  const removeFile = useCallback(
    (index: number) => {
      const removed = files[index];
      const newFiles = files.filter((_, i) => i !== index);
      setFiles(newFiles);
      onFilesChange?.(newFiles);
      setProgressMap((prev) => {
        const { [removed.name]: _, ...rest } = prev;
        return rest;
      });
      setChannels((prev) =>
        prev.filter((ch) => !ch.endsWith(removed.uploadKey))
      );
    },
    [files, onFilesChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxFiles,
    maxSize,
    onDropRejected,
  });

  // FIX 2: Correct the useEffect synchronization logic
  useEffect(() => {
    let newFiles: FileWithKey[] = [];

    if (value) {
      // Coerce to an array of the nested FileValueInForm objects
      const valueArray = Array.isArray(value) ? value : [value];

      newFiles = valueArray
        .filter((item) => item && item.file) // Ensure the nested 'file' object exists
        // Extract the inner 'file' object which is the correct FileWithKey type
        .map((item) => item.file);
    }

    // Only update state if the list has changed
    // We check length and if every new file is found in the current state
    if (
      files.length !== newFiles.length ||
      newFiles.some((nf) => !files.find((f) => f.uploadKey === nf.uploadKey))
    ) {
      setFiles(newFiles);
      const newChannels = newFiles.map((f) =>
        pusherChannel.attachmentProgress(f.uploadKey)
      );
      setChannels(newChannels);
    }
    // The dependency array should include 'value' to re-run when the form state changes,
    // and 'files' to reference the state in the change check (if needed), but
    // since 'files' is derived from 'value', keeping it simple on just 'value' is usually better.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div
      className={cn(
        "space-y-4",
        className,
        disabled && "opacity-60 pointer-events-none"
      )}
    >
      <div
        {...getRootProps({
          className: cn(
            "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
            disabled
              ? "cursor-not-allowed bg-muted/50"
              : isDragActive
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50"
          ),
        })}
      >
        <input {...getInputProps({ disabled })} />
        <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        {isDragActive ? (
          <p className="text-primary">Drop the files here...</p>
        ) : (
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              {title ?? "Drag & drop files here, or click to select files"}
            </p>
            <p className="text-xs text-muted-foreground">
              Max {maxFiles} {maxFiles === 1 ? "file" : "files"}, up to{" "}
              {Math.round(maxSize / 1024 / 1024)}MB each
            </p>
          </div>
        )}
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Files:</h4>
          {files.map((file, index) => {
            // 'file' is now the correct FileWithKey object, so file.name and file.size are available
            const progress = progressMap[file.uploadKey] ?? 0;
            return (
              <div
                key={file.uploadKey}
                className="flex flex-col bg-muted rounded-md p-2 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <File className="h-4 w-4" />
                    <span className="text-sm truncate">{file.name}</span>
                    {/* This line is now correctly referencing file.size, fixing the NANKB error */}
                    <span className="text-xs text-muted-foreground">
                      ({Math.round(file.size / 1024)}KB)
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="h-6 w-6 p-0"
                    disabled={disabled}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>

                <div className="h-2 bg-muted-foreground/10 rounded-full mt-2 overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground mt-1">
                  {progress.toFixed(0)}%
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

"use client";

import React from "react";
import RequiredField from "@/components/common/required-field";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { FileUpload } from "@/components/common/file-upload";
interface FileUploadFormFieldProps {
  fieldName: string;
  label?: string;
  form: any;
  title?: string;
  accept?: Record<string, string[]>;
  maxFiles?: number;
  maxSize?: number;
  required?: boolean;
  disabled?: boolean;
}

const FileDropUploadFormField: React.FC<FileUploadFormFieldProps> = ({
  fieldName,
  label = "",
  form,
  title = "Drop the file here or click to browse",
  accept = { "application/pdf": [".pdf"] },
  maxFiles = 1,
  maxSize = 5 * 1024 * 1024,
  required = false,
  disabled = false,
}) => {
  return (
    <FormField
      control={form.control}
      name={fieldName}
      render={({ field }) => {
        const fileErrorMessage =
          form.formState.errors[fieldName]?.file?.message;
        return (
          <FormItem>
            {label && (
              <FormLabel>
                {label}
                {required ? (
                  <RequiredField />
                ) : (
                  <span className="text-gray-500 font-light">(Optional)</span>
                )}
              </FormLabel>
            )}
            <FormControl>
              <FileUpload
                title={title}
                accept={accept}
                maxFiles={maxFiles}
                maxSize={maxSize}
                disabled={form.formState.isSubmitting || disabled}
                value={field.value}
                onFilesChange={async (files) => {
                  if (!files || files.length === 0) {
                    field.onChange(null);
                    return;
                  }
                  const formValues = files.map((file) => ({
                    file,
                    uploadKey: file.uploadKey,
                  }));

                  field.onChange(maxFiles === 1 ? formValues[0] : formValues);
                }}
              />
            </FormControl>
            {fileErrorMessage && (
              <p className="text-sm font-medium text-destructive mt-1">
                {fileErrorMessage || "Invalid File."}
              </p>
            )}
          </FormItem>
        );
      }}
    />
  );
};

export { FileDropUploadFormField };

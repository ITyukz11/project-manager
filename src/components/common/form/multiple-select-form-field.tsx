"use client";

import React from "react";
import RequiredField from "@/components/common/required-field";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";
import {
  MultiSelectExpandable,
  SelectDataSource,
} from "@/components/ui/select-multiple-expandable";

interface MultiSelectFormFieldProps {
  key?: string;
  fieldName: string;
  label?: string;
  form: any;
  items?: SelectDataSource;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  isLoading?: boolean;
  valueField?: string;
  labelField?: string;
  tooltipField?: string;
  maxShownItems?: number;
  className?: string;
  fullWidth?: boolean;
}

const MultiSelectFormField: React.FC<MultiSelectFormFieldProps> = ({
  fieldName,
  label = "",
  form,
  items = [],
  placeholder = "Select options...",
  disabled = false,
  required = false,
  isLoading = false,
  valueField = "value",
  labelField = "label",
  tooltipField = "description",
  maxShownItems = 3,
  className = "",
  fullWidth,
}) => (
  <FormField
    control={form.control}
    name={fieldName}
    render={({ field, fieldState }) => (
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
          <MultiSelectExpandable
            isLoading={isLoading}
            items={items}
            valueField={valueField}
            labelField={labelField}
            tooltipField={tooltipField}
            disabled={form.formState.isSubmitting || disabled}
            selectedValues={field.value || []}
            onValuesChange={field.onChange}
            placeholder={placeholder}
            maxShownItems={maxShownItems}
            fullWidth={fullWidth}
            className={cn(
              "rounded-md",
              className,
              fieldState.error
                ? "border-destructive focus:ring-destructive"
                : "border-input"
            )}
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
);

export { MultiSelectFormField };

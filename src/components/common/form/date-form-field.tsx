/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { DatePicker } from "@/components/common/date-picker";

interface DateFormFieldProps {
  fieldName: string;
  label?: string;
  form: any;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}

const DateFormField: React.FC<DateFormFieldProps> = ({
  fieldName,
  label = "",
  form,
  placeholder = "Pick a date",
  required = false,
  disabled = false,
}) => (
  <FormField
    control={form.control}
    name={fieldName}
    render={({ field, fieldState }) => (
      <FormItem className="flex flex-col">
        {label && (
          <FormLabel className="pt-2">
            {label}
            {required ? (
              <RequiredField />
            ) : (
              <span className="text-gray-500 font-light">(Optional)</span>
            )}
          </FormLabel>
        )}
        <FormControl>
          <DatePicker
            disabled={form.formState.isSubmitting || disabled}
            placeholder={placeholder}
            {...field}
            value={
              field.value
                ? typeof field.value === "string"
                  ? new Date(field.value)
                  : field.value
                : undefined
            }
            onChange={field.onChange}
            className={cn(
              "w-full justify-start text-left font-normal border rounded-md",
              !field.value && "text-muted-foreground",
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

export { DateFormField };

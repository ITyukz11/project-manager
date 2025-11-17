"use client"

import React from "react"
import RequiredField from "@/components/common/required-field"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { cn } from "@/lib/utils"
import { MultiLevelItem, SelectMultiLevel } from "@/components/ui/select-multiple-level"

type MultiLevelSelectFormFieldProps = {
  key?: string
  fieldName: string
  label?: string
  form: any
  placeholder?: string
  className?: string
  selectClassName?: string
  buttonClassName?: string
  items: MultiLevelItem[]
  multiple?: boolean
  required?: boolean
  width?: number
  maxShownBadges?: number
  disabled?: boolean
}

/**
 * A form-integrated wrapper for MultiLevelSelectFormField.
 * Supports labels, required indicators, and form validation messages.
 */
export function MultiLevelSelectFormField({
  fieldName,
  label = "",
  form,
  placeholder = "Select item...",
  className,
  selectClassName,
  buttonClassName,
  items,
  multiple = false,
  required = false,
  maxShownBadges = 2,
  disabled = false
}: MultiLevelSelectFormFieldProps) {
  return (
    <FormField
      control={form.control}
      name={fieldName}
      render={({ field, fieldState }) => (
        <FormItem className={cn("flex flex-col space-y-1 w-full", className)}>
          {label && (
            <FormLabel className="w-full">
              {label}
              {required && <RequiredField />}
            </FormLabel>
          )}
          <FormControl>
            <SelectMultiLevel
              items={items}
              multiple={multiple}
              value={field.value}
              onChange={field.onChange}
              placeholder={placeholder}
              className={cn("w-full", selectClassName)}
              buttonClassName={cn("w-full", buttonClassName, fieldState.error ? "border-destructive focus:ring-destructive" : "border-input")}
              maxShownBadges={maxShownBadges}
              disabled={disabled}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

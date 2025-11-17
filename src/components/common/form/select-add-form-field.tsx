"use client"

import * as React from "react"
import RequiredField from "@/components/common/required-field"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { cn } from "@/lib/utils"
import { SelectMultipleAdd } from "@/components/ui/select-multiple-add"

type Option = {
  value: string
  label: string
  children?: Option[]
}

interface SelectAddFormFieldProps {
  fieldName: string
  label?: string
  form: any
  options: Option[]
  placeholder?: string
  className?: string
  required?: boolean
  multiple?: boolean
  selectClassName?: string
  buttonClassName?: string
  addNewLabel?: string
  onAddNew?: () => void
  disabled?: boolean
}

export function SelectAddFormField({
  fieldName,
  label,
  form,
  options,
  placeholder = "Select...",
  className,
  required = false,
  multiple = false,
  selectClassName = "",
  buttonClassName = "",
  addNewLabel,
  onAddNew,
  disabled
}: SelectAddFormFieldProps) {
  // const value = form.watch(fieldName)

  // const handleChange = (val: string[] | string) => {
  //   form.setValue(fieldName, val)
  // }

  return (
    <FormField
      control={form.control}
      name={fieldName}
      render={({ field, fieldState }) => (
        <FormItem className={cn("space-y-0 w-full", className)}>
          {label && (
            <FormLabel>
              {label}
              {required && <RequiredField />}
            </FormLabel>
          )}

          <FormControl>
            <SelectMultipleAdd
              options={options}
              value={field.value}
              onChange={field.onChange}
              placeholder={placeholder}
              multiple={multiple}
              selectClassName={selectClassName}
              buttonClassName={buttonClassName}
              addNewLabel={addNewLabel}
              onAddNew={onAddNew}
              disabled={disabled}
              className={cn("rounded-md", fieldState.error ? "border-destructive focus:ring-destructive" : "border-input")}
            />
          </FormControl>

          <FormMessage />
        </FormItem>
      )}
    />
  )
}

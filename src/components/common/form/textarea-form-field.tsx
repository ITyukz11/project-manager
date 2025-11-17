"use client"

import React from "react"
import RequiredField from "@/components/common/required-field"
import { FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"

interface TextareaFormFieldProps {
  fieldName: string
  label?: string
  description?: string
  form: any
  placeholder?: string
  disabled?: boolean
  required?: boolean
  className?: string
}

/**
 * Reusable textarea form field component.
 */
const TextareaFormField: React.FC<TextareaFormFieldProps> = ({
  fieldName,
  label = "",
  description,
  form,
  placeholder = "Enter text...",
  disabled = false,
  required = false,
  className = "resize-y"
}) => (
  <FormField
    control={form.control}
    name={fieldName}
    render={({ field }) => (
      <FormItem className="sm:col-span-2">
        {label && (
          <FormLabel>
            {label}
            {required ? <RequiredField /> : <span className="text-gray-500 font-light">(Optional)</span>}
          </FormLabel>
        )}
        <FormControl>
          <Textarea disabled={form.formState.isSubmitting || disabled} placeholder={placeholder} className={className} {...field} />
        </FormControl>
        {description && <FormDescription>{description}</FormDescription>}
        <FormMessage />
      </FormItem>
    )}
  />
)

export { TextareaFormField }

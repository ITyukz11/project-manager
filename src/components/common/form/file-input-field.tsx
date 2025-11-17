import RequiredField from "@/components/common/required-field"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type FileFormFieldProps = {
  key?: string
  fieldName: string
  label?: string
  form: any
  className?: string
  inputClassName?: string
  required?: boolean
  accept?: Record<string, string[]>
  multiple?: boolean
}

export function FileInputFormField({ fieldName, label = "", form, className, inputClassName, required = false, accept, multiple = false }: FileFormFieldProps) {
  const acceptString = accept ? Object.values(accept).flat().join(",") : undefined

  return (
    <FormField
      control={form.control}
      name={fieldName}
      render={({ field }) => (
        <FormItem className={cn("space-y-0", className)}>
          {label && (
            <FormLabel>
              {label}
              {required && <RequiredField />}
            </FormLabel>
          )}
          <FormControl>
            <Input
              type="file"
              disabled={form.formState.isSubmitting}
              onChange={e => {
                const files = e.target.files
                field.onChange(multiple ? files : files?.[0])
              }}
              className={cn(inputClassName)}
              accept={acceptString}
              multiple={multiple}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

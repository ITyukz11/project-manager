import RequiredField from "@/components/common/required-field"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { Loader2, X } from "lucide-react"

export type SelectOption = {
  label: string
  value: string
}

const SelectFormField = ({
  fieldName,
  label = "",
  form,
  options = [],
  placeholder = "Select an option",
  disabled = false,
  required = false,
  isLoading = false,
  allowClear = false
}: {
  key?: string
  fieldName: string
  label?: string
  form: any
  options: SelectOption[]
  placeholder?: string
  disabled?: boolean
  required?: boolean
  isLoading?: boolean
  allowClear?: boolean
}) => (
  <FormField
    control={form.control}
    name={fieldName}
    render={({ field }) => (
      <FormItem className="space-y-0">
        {label && (
          <FormLabel>
            {label}
            {required ? <RequiredField /> : <span className="text-gray-500 font-light">(Optional)</span>}
          </FormLabel>
        )}
        <FormControl>
          <div className="relative w-full">
            {/* Select Component */}
            <Select disabled={form.formState.isSubmitting || disabled || isLoading} onValueChange={field.onChange} value={field.value || ""}>
              {/* Add extra padding-right for both icons */}
              <SelectTrigger className={cn("w-full", allowClear && field.value && !isLoading && "pr-8")}>
                {isLoading ? (
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Fetching...
                  </span>
                ) : (
                  <SelectValue placeholder={placeholder} />
                )}
              </SelectTrigger>

              {!isLoading && (
                <SelectContent>
                  {options.length > 0 ? (
                    options.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="py-2 px-3 text-sm text-muted-foreground text-center">No options available</div>
                  )}
                </SelectContent>
              )}
            </Select>

            {allowClear && field.value && !isLoading && (
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation() // prevent dropdown toggle
                  form.setValue(fieldName, "")
                }}
                className={`absolute right-3 top-1/2 -translate-y-1/2 transition ${
                  form.formState.isSubmitting || disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer text-muted-foreground hover:text-foreground"
                }`}
                disabled={form.formState.isSubmitting || disabled}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
)

export { SelectFormField }

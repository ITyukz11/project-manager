import RequiredField from "@/components/common/required-field";
import { formatAmount } from "@/components/formatAmount";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const AmountFormField = ({
  fieldName,
  label = "",
  form,
  placeholder = "Optional",
  required = false,
}: {
  key?: string;
  fieldName: string;
  label?: string;
  form: any;
  placeholder?: string;
  required?: boolean;
}) => (
  <FormField
    control={form.control}
    name={fieldName}
    render={({ field }) => (
      <FormItem className="space-y-0">
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
          <div className="relative overflow-visible">
            <Label
              className={cn(
                "absolute left-2 bottom-3",
                form.formState.isSubmitting && "text-gray-700"
              )}
            >
              ₱
            </Label>
            <Input
              className="pl-5 z-auto"
              type="text"
              inputMode="decimal"
              placeholder={placeholder}
              value={
                field.value === null || field.value === undefined
                  ? ""
                  : formatAmount(field.value)
              }
              disabled={form.formState.isSubmitting}
              onChange={(e) => {
                // Remove commas for storing raw value
                const raw = e.target.value.replace(/,/g, "");
                // Still allow decimals
                field.onChange(Number(raw));
              }}
            />
          </div>
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
);

export { AmountFormField };

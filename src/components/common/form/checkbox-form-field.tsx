/* eslint-disable @typescript-eslint/no-explicit-any */
import RequiredField from "@/components/common/required-field";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

type CheckboxFormFieldProps = {
  key?: string;
  fieldName: string;
  label?: string;
  form: any;
  className?: string;
  required?: boolean;
};

export function CheckboxFormField({
  fieldName,
  label = "",
  form,
  className,
  required = false,
}: CheckboxFormFieldProps) {
  return (
    <FormField
      control={form.control}
      name={fieldName}
      render={({ field }) => (
        <FormItem className={cn("flex items-center space-x-2", className)}>
          <FormControl>
            <Checkbox
              disabled={form.formState.isSubmitting}
              checked={field.value ?? false}
              onCheckedChange={(val) => field.onChange(val)}
            />
          </FormControl>
          {label && (
            <FormLabel className="m-0">
              {label}
              {required && <RequiredField />}
            </FormLabel>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

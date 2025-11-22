import RequiredField from "@/components/common/required-field";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type TextFormFieldProps = {
  key?: string;
  type: string;
  fieldName: string;
  label?: string;
  form: any;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  required?: boolean;
  uppercase?: boolean;
  disabled?: boolean;
};

export function InputFormField({
  fieldName,
  type = "text",
  label = "",
  form,
  placeholder = "Optional",
  className,
  inputClassName,
  required = false,
  uppercase = false,
  disabled = false,
}: TextFormFieldProps) {
  return (
    <FormField
      control={form.control}
      name={fieldName}
      render={({ field }) => (
        <FormItem className={cn("flex flex-col", className)}>
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
            <Input
              type={type}
              disabled={form.formState.isSubmitting || disabled}
              placeholder={placeholder}
              {...field}
              value={field.value ?? ""}
              onChange={(e) => {
                const val = uppercase
                  ? e.target.value.toUpperCase()
                  : e.target.value;
                field.onChange(val);
              }}
              className={cn(uppercase && "uppercase", inputClassName)}
              autoComplete="new-password"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

import RequiredField from "@/components/common/required-field";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const NumberFormField = ({
  fieldName,
  label = "",
  form,
  placeholder = "Optional",
  step = 1,
  required = false,
}: {
  key?: string;
  fieldName: string;
  label?: string;
  form: any;
  step?: number;
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
          <Input
            disabled={form.formState.isSubmitting}
            type="number"
            step={step}
            placeholder={placeholder}
            {...field}
            value={
              field.value === null || field.value === undefined
                ? ""
                : (field.value as number)
            }
            onChange={field.onChange}
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
);

export { NumberFormField };

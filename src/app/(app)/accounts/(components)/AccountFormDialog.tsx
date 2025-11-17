"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { GlobalFormField } from "@/components/common/form";
import RequiredField from "@/components/common/required-field";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";

// Zod validation schema
const AccountFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  username: z.string().min(1, "Username is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  messengerLink: z.string().min(1, "Messenger Link is required"),
  role: z.enum(["ADMIN", "FAP", "MASTER_AGENT", "TL", "LOADER", "ACCOUNTING"], {
    message: "Account Type is required",
  }),
});

export type AccountFormDialogValues = z.infer<typeof AccountFormSchema>;

export function AccountFormDialog({
  open,
  onOpenChange,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [loading, setLoading] = React.useState(false);
  const form = useForm<AccountFormDialogValues>({
    resolver: zodResolver(AccountFormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      messengerLink: "",
      role: undefined,
    },
  });

  React.useEffect(() => {
    form.reset();
  }, [form, open]);

  async function handleSubmit(values: AccountFormDialogValues) {
    setLoading(true);
    try {
      const res = await fetch("/api/user", {
        method: "POST",
        body: JSON.stringify(values),
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (!res.ok) {
        // Show error toast (message from API if possible)
        toast.error(data?.error || "Failed to create account.");
        return;
      }

      toast.success("Account created successfully!");
      onOpenChange?.(false);
      form.reset();
    } catch (err: any) {
      // Show toast for network or unexpected errors
      toast.error(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New User</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
            autoComplete="off"
          >
            <GlobalFormField
              form={form}
              fieldName="name"
              label="Name"
              required
              type="text"
              placeholder="Enter name"
            />
            <GlobalFormField
              form={form}
              fieldName="username"
              label="Username"
              required
              type="text"
              placeholder="Enter username"
            />
            <GlobalFormField
              form={form}
              fieldName="role"
              label="Account Type"
              required
              type="select"
              options={["ADMIN", "TL", "LOADER", "ACCOUNTING"].map((role) => ({
                label: role,
                value: role,
              }))}
              placeholder="Enter account type"
            />
            <GlobalFormField
              form={form}
              fieldName="messengerLink"
              label="Messenger Link"
              required
              type="text"
              placeholder="Enter messenger link"
            />

            <GlobalFormField
              form={form}
              fieldName="email"
              label="Email"
              required
              type="text"
              placeholder="Enter email"
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Password <RequiredField />
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter password"
                      type="password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Spinner /> Submitting...
                  </>
                ) : (
                  "Submit"
                )}
              </Button>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={loading}>
                  Cancel
                </Button>
              </DialogClose>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

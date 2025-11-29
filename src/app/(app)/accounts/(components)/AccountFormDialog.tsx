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
  Dialog,
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
import { useUsers } from "@/lib/hooks/swr/user/useUsersData";

// INCLUDE useCasinoGroup HOOK!
import { useCasinoGroup } from "@/lib/hooks/swr/casino-group/useCasinoGroup";
import {
  avoidDefaultDomBehavior,
  handleKeyDown,
} from "@/lib/utils/dialogcontent.utils";

// Zod validation schema
const AccountFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  username: z.string().min(1, "Username is required"),
  email: z.string().email("Invalid email address"),
  casinoGroupId: z.array(z.string()).optional(), // <-- support an array
  password: z.string().min(1, "Password is required"),
  messengerLink: z.string().optional(),
  role: z.enum(["ADMIN", "FAP", "MASTER_AGENT", "TL", "LOADER", "ACCOUNTING"], {
    message: "Account Type is required",
  }),
});

export type AccountFormDialogValues = z.infer<typeof AccountFormSchema>;

export function AccountFormDialog({
  open,
  onOpenChange,
  casinoGroup,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  casinoGroup: string | null;
}) {
  const [loading, setLoading] = React.useState(false);
  const { refetchUsers } = useUsers(casinoGroup || "");

  // Fetch casino groups for the select input
  // This might be all groups, so calling with no param
  const { casinoGroupData, casinoGroupLoading, casinoGroupError } =
    useCasinoGroup();

  const form = useForm<AccountFormDialogValues>({
    resolver: zodResolver(AccountFormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      messengerLink: "",
      role: undefined,
      casinoGroupId: [],
    },
  });

  React.useEffect(() => {
    form.reset();
  }, [form, open]);

  async function handleSubmit(values: AccountFormDialogValues) {
    setLoading(true);
    try {
      const finalValues = {
        ...values,
        casinoGroups: casinoGroup || values.casinoGroupId,
      };
      const res = await fetch("/api/user", {
        method: "POST",
        body: JSON.stringify(finalValues),
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data?.error || "Failed to create account.");
        return;
      }

      toast.success("Account created successfully!");
      onOpenChange?.(false);
      refetchUsers();
      form.reset();
    } catch (err: any) {
      toast.error(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[95vh] overflow-y-auto"
        onPointerDownOutside={avoidDefaultDomBehavior}
        onInteractOutside={avoidDefaultDomBehavior}
        onKeyDown={handleKeyDown}
      >
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
              required={false}
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
            {/* Casino Group Selection */}
            {casinoGroupError && (
              <div className="text-red-500">Error loading casino groups</div>
            )}

            <GlobalFormField
              form={form}
              type="multiselect"
              fieldName="casinoGroupId"
              label="Casino Group"
              required={!casinoGroup}
              isLoading={casinoGroupLoading || loading}
              items={
                Array.isArray(casinoGroupData)
                  ? casinoGroupData.map((group: any) => ({
                      label: group.name,
                      value: group.id,
                    }))
                  : []
              }
              placeholder="Select a casino group"
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

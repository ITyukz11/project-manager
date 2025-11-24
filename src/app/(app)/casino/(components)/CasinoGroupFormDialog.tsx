"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
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
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import RequiredField from "@/components/common/required-field";
import { useUsers } from "@/lib/hooks/swr/user/useUsersData";
import { GlobalFormField } from "@/components/common/form";
import { useUserCasinoGroups } from "@/lib/hooks/swr/user/useUserCasinoGroup";
import { useSession } from "next-auth/react";
import { useCasinoGroup } from "@/lib/hooks/swr/casino-group/useCasinoGroup";

// Validation schema (now include users as array!)
export const CasinoGroupFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  users: z.array(z.string()).optional(), // array of user IDs
});

type CasinoGroupFormValues = z.infer<typeof CasinoGroupFormSchema>;

export function CasinoGroupFormDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (newGroup: any) => void; // Optional callback
}) {
  const [loading, setLoading] = React.useState(false);
  const { data: session } = useSession();
  // Fetch users for the multiselect
  const { usersData, usersLoading } = useUsers();
  const { refetchCasinoGroups } = useUserCasinoGroups(session?.user?.id);
  const { refetchCasinoGroup } = useCasinoGroup();
  const form = useForm<CasinoGroupFormValues>({
    resolver: zodResolver(CasinoGroupFormSchema),
    defaultValues: {
      name: "",
      description: "",
      users: [],
    },
  });

  React.useEffect(() => {
    form.reset();
  }, [form, open]);

  async function handleSubmit(values: CasinoGroupFormValues) {
    setLoading(true);
    try {
      const res = await fetch("/api/casino-group", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const result = await res.json();
      if (!res.ok) {
        toast.error(result?.error || "Failed to create casino group.");
        return;
      }
      toast.success("Casino group created!");
      onOpenChange(false);
      form.reset();
      onCreated?.(result);
      refetchCasinoGroups();
      refetchCasinoGroup();
      // update();
      // router.refresh(); //to fetch new session
    } catch (err: any) {
      toast.error(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Casino Group </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Name <RequiredField />
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Enter group name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="(Optional) Enter a description"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Multiselect: Add users to this casino group */}
            <GlobalFormField
              form={form}
              type="multiselect"
              fieldName="users"
              label="Assign Users"
              required={false}
              items={
                !usersLoading && Array.isArray(usersData)
                  ? usersData.map((user: any) => ({
                      label: `${user.username} (${user.role})`,
                      value: user.id,
                    }))
                  : []
              }
              placeholder="Select users for this casino group"
            />

            <DialogFooter>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Spinner /> Submitting...
                  </>
                ) : (
                  "Create"
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

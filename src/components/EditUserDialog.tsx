"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
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
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { useUsers } from "@/lib/hooks/swr/user/useUsersData";
import {
  avoidDefaultDomBehavior,
  handleKeyDown,
} from "@/lib/utils/dialogcontent.utils";
import { useUserById } from "@/lib/hooks/swr/user/useUserById";

const EditAccountSchema = z.object({
  name: z.string().min(1, "Name is required"),
  username: z.string().min(1, "Username is required"),
  email: z.email(),
  messengerLink: z.string().optional(),
  role: z.string().optional(),
});

export type EditAccountDialogValues = z.infer<typeof EditAccountSchema>;

export function EditAccountDialog({
  open,
  onOpenChange,
  userId,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  userId: string | undefined;
}) {
  const [loading, setLoading] = React.useState(false);

  // Fetch the user using your SWR hook
  const {
    userData,
    userLoading: isUserLoading,
    userError,
    mutate,
  } = useUserById(userId);

  // Convert casinoGroups objects to array of id strings for the form

  const form = useForm<EditAccountDialogValues>({
    resolver: zodResolver(EditAccountSchema),
    defaultValues: {
      name: userData?.name ?? "",
      username: userData?.username ?? "",
      email: userData?.email ?? "",
      messengerLink: userData?.messengerLink ?? "",
      role: userData?.role ?? undefined,
    },
  });

  // Reset form values when dialog opens or userData changes
  React.useEffect(() => {
    if (open && userData) {
      form.reset({
        name: userData.name ?? "",
        username: userData.username ?? "",
        email: userData.email ?? "",
        messengerLink: userData.messengerLink ?? "",
        role: userData.role ?? undefined,
      });
    }
    // eslint-disable-next-line
  }, [open, userData]);

  async function handleSubmit(values: EditAccountDialogValues) {
    setLoading(true);
    try {
      const res = await fetch(`/api/user/${userId}`, {
        method: "PATCH",
        body: JSON.stringify(values),
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data?.error || "Failed to update account.");
        return;
      }

      toast.success("Account updated successfully!");
      onOpenChange?.(false);
      mutate();
    } catch (err: any) {
      toast.error(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[95vh] overflow-y-auto overflow-visible"
        onPointerDownOutside={avoidDefaultDomBehavior}
        onInteractOutside={avoidDefaultDomBehavior}
        onKeyDown={handleKeyDown}
      >
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
        </DialogHeader>
        {isUserLoading ? (
          <div className="flex justify-center p-8">
            <Spinner />
          </div>
        ) : userError ? (
          <div className="text-red-500">Failed to load user.</div>
        ) : (
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
                options={["ADMIN", "TL", "LOADER", "ACCOUNTING"].map(
                  (role) => ({
                    label: role,
                    value: role,
                  })
                )}
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
              <DialogFooter>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Spinner /> Saving...
                    </>
                  ) : (
                    "Save"
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
        )}
      </DialogContent>
    </Dialog>
  );
}

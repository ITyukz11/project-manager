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
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import RequiredField from "@/components/common/required-field";
import { useUsers } from "@/lib/hooks/swr/user/useUsersData";
import { GlobalFormField } from "@/components/common/form";
import { useCasinoGroup } from "@/lib/hooks/swr/casino-group/useCasinoGroup";
import { useUserCasinoGroups } from "@/lib/hooks/swr/user/useUserCasinoGroup";
import { useSession } from "next-auth/react";
import CustomFormDialog from "@/components/CustomFormDialog";
import { useState } from "react";
import {
  avoidDefaultDomBehavior,
  handleKeyDown,
} from "@/lib/utils/dialogcontent.utils";

const CasinoGroupEditSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  users: z.array(z.string()).optional(),
});

type CasinoGroupEditFormValues = z.infer<typeof CasinoGroupEditSchema>;

export function CasinoGroupEditDialog({
  open,
  onOpenChange,
  casinoRowId,
  onUpdated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  casinoRowId: string;
  onUpdated?: (updatedGroup: any) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Dialog state for delete confirmation
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [typedName, setTypedName] = useState("");

  const { usersData, usersLoading } = useUsers();
  const { data: session } = useSession();
  const { casinoGroupData, casinoGroupLoading, refetchCasinoGroup } =
    useCasinoGroup(casinoRowId);
  const { refetchCasinoGroup: refetchAllCasinoGroups } = useCasinoGroup();
  const { refetchCasinoGroups } = useUserCasinoGroups(session?.user?.id);

  // Get the current group's name for validation (use "" fallback)
  const groupName =
    casinoGroupData && casinoGroupData.length > 0
      ? casinoGroupData[0].name ?? ""
      : "";

  const form = useForm<CasinoGroupEditFormValues>({
    resolver: zodResolver(CasinoGroupEditSchema),
    defaultValues: {
      name: "",
      description: "",
      users: [],
    },
  });

  React.useEffect(() => {
    if (casinoGroupData && casinoGroupData.length > 0 && open) {
      const group = casinoGroupData[0];
      form.reset({
        name: group.name,
        description: group.description ?? "",
        users: Array.isArray(group.users)
          ? group.users.map((u: any) => u.id)
          : [],
      });
    }
  }, [open, casinoGroupData, form]);

  async function handleSubmit(values: CasinoGroupEditFormValues) {
    setLoading(true);
    try {
      const res = await fetch(`/api/casino-group/${casinoRowId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const result = await res.json();
      if (!res.ok) {
        toast.error(result?.error || "Failed to update casino group.");
        return;
      }
      toast.success("Casino group updated!");
      onOpenChange(false);
      onUpdated?.(result);
      refetchCasinoGroup();
      refetchAllCasinoGroups();
      refetchCasinoGroups();
    } catch (err: any) {
      toast.error(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteConfirmed() {
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/casino-group/${casinoRowId}`, {
        method: "DELETE",
      });
      const result = await res.json();
      if (!res.ok) {
        toast.error(result?.error || "Failed to delete casino group.");
        return;
      }
      toast.success("Casino group deleted!");
      setOpenDeleteDialog(false);
      onOpenChange(false);
      onUpdated?.(result);
      refetchCasinoGroup();
      refetchAllCasinoGroups();
      refetchCasinoGroups();
      setTypedName("");
    } catch (err: any) {
      toast.error(err.message || "Something went wrong.");
    } finally {
      setDeleteLoading(false);
    }
  }

  // Loading UI for fetching group
  if (casinoGroupLoading && open) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          onPointerDownOutside={avoidDefaultDomBehavior}
          onInteractOutside={avoidDefaultDomBehavior}
          onKeyDown={handleKeyDown}
        >
          <DialogHeader>
            <DialogTitle>Edit Casino Group</DialogTitle>
          </DialogHeader>
          <div className="flex gap-3 flex-row justify-center items-center py-8 w-full">
            <Spinner />
            Loading
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Casino Group</DialogTitle>
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
                      <Input placeholder="Edit group name" {...field} />
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
                        placeholder="(Optional) Edit description"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                  {loading ? <Spinner /> : "Update"}
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setOpenDeleteDialog(true)}
                  disabled={loading}
                >
                  Delete
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

      {/* Delete confirmation dialog using CustomFormDialog */}
      <CustomFormDialog
        open={openDeleteDialog}
        onClose={() => {
          setOpenDeleteDialog(false);
          setTypedName("");
        }}
        onConfirm={handleDeleteConfirmed}
        title="Delete Casino Group"
        description={`To confirm deletion, please type: "${groupName}". This action cannot be undone.`}
        confirmLabel="Delete"
        loading={deleteLoading}
        disableConfirm={typedName !== groupName || deleteLoading}
        content={
          <Input
            placeholder={
              !groupName ? "Casino group name..." : `Type "${groupName}"`
            }
            value={typedName}
            onChange={(e) => setTypedName(e.target.value)}
            disabled={loading}
            autoFocus
          />
        }
      />
    </>
  );
}

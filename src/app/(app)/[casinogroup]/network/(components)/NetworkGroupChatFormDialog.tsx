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
import { useGroupChats } from "@/lib/hooks/swr/network/useGroupChat";
import { useParams } from "next/navigation";
import {
  avoidDefaultDomBehavior,
  handleKeyDown,
} from "@/lib/utils/dialogcontent.utils";
import { useUsers } from "@/lib/hooks/swr/user/useUsersData";

// Zod schema for GroupChat creation
const GroupChatFormSchema = z.object({
  name: z.string().min(1, "Group Chat name is required"),
  status: z.boolean().optional(), // status toggle, default true below
  users: z.array(z.string()).optional(), // user IDs
});

export type GroupChatFormValues = z.infer<typeof GroupChatFormSchema>;

export function NetworkGroupChatFormDialog({ open, onOpenChange }) {
  const [loading, setLoading] = React.useState(false);
  const params = useParams();
  const casinoGroup = params.casinogroup?.toLocaleString();
  // Fetch network users to be assigned to the group chat
  const { usersData, usersLoading } = useUsers(casinoGroup);
  const { refetchGroupChats } = useGroupChats(casinoGroup);

  const form = useForm<GroupChatFormValues>({
    resolver: zodResolver(GroupChatFormSchema),
    defaultValues: {
      name: "",
      status: true,
      users: [],
    },
  });

  React.useEffect(() => {
    form.reset();
  }, [form, open]);

  // POST create group chat
  async function handleSubmit(values: GroupChatFormValues) {
    setLoading(true);
    try {
      const finalValues = { ...values, casinoGroupName: casinoGroup };
      const res = await fetch("/api/network/group-chats", {
        method: "POST",
        body: JSON.stringify(finalValues),
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || "Failed to create group chat.");
        return;
      }
      toast.success("Group chat created successfully!");
      onOpenChange?.(false);
      refetchGroupChats();
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
        className="overflow-y-auto max-h-[90vh] w-full max-w-sm sm:max-w-md md:max-w-lg px-2 sm:px-6 py-6 rounded-lg"
        onPointerDownOutside={avoidDefaultDomBehavior}
        onInteractOutside={avoidDefaultDomBehavior}
        onKeyDown={handleKeyDown}
      >
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl font-bold">
            New Group Chat
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="flex flex-col gap-4 "
            autoComplete="off"
          >
            <GlobalFormField
              form={form}
              fieldName="name"
              label="Group Chat Name"
              required
              type="text"
              placeholder="Enter group chat name"
              inputClassName="w-full"
            />

            <GlobalFormField
              form={form}
              fieldName="users"
              label="Add Users"
              required={false}
              type="multiselect"
              items={
                usersData == null
                  ? []
                  : usersData?.map((user) => ({
                      label:
                        user.username + (user.role ? ` (${user.role})` : ""),
                      value: user.id,
                    }))
              }
              placeholder={
                usersLoading ? "Loading users..." : "Select users (optional)"
              }
            />

            <DialogFooter className="flex flex-row gap-2 mt-4">
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Spinner /> Submitting...
                  </>
                ) : (
                  "Create Group Chat"
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

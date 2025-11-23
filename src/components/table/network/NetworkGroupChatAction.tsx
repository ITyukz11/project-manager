"use client";

import * as React from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { GlobalFormField } from "@/components/common/form";
import { useUsersNetwork } from "@/lib/hooks/swr/network/useUserNetwork";
import { useGroupChats } from "@/lib/hooks/swr/network/useGroupChat";
import { Label } from "@/components/ui/label";
import { MultiSelectExpandable } from "@/components/ui/select-multiple-expandable";
import { User } from "@prisma/client";

// Zod validation schema for GroupChat fields
const GroupChatFormSchema = z.object({
  name: z.string().min(1, "Group name is required"),
  status: z.boolean(),
  members: z.array(z.string()).optional(),
});

export type GroupChatEditDialogValues = z.infer<typeof GroupChatFormSchema>;

export interface NetworkGroupChatEditDialogProps {
  groupChatId: string;
  groupChatName: string;
  groupChatStatus: boolean;
  members?: User[];
  onEdit: () => void;
}

export function NetworkGroupChatEditDialog({
  groupChatId,
  groupChatName,
  groupChatStatus,
  members = [],
  onEdit,
}: NetworkGroupChatEditDialogProps) {
  const [loading, setLoading] = React.useState(false);

  const { usersDataNetwork, usersLoadingNetwork } = useUsersNetwork();
  const { refetchGroupChats } = useGroupChats();
  console.log("groupchatname: ", groupChatName);
  // prepare options for member selection
  const memberIds = React.useMemo(
    () => members.map((user) => user.id),
    [members]
  );

  const options =
    usersDataNetwork?.map((user) => ({
      value: user.id,
      label: `${user.role} - ${user.name}`,
      tooltip: user.email,
    })) || [];

  // Setup react-hook-form
  const form = useForm<GroupChatEditDialogValues>({
    resolver: zodResolver(GroupChatFormSchema),
    defaultValues: {
      name: groupChatName,
      status: groupChatStatus,
      members: memberIds,
    },
    mode: "onChange",
  });

  React.useEffect(() => {
    form.reset({
      name: groupChatName,
      status: groupChatStatus,
      members: memberIds,
    });
  }, [form, groupChatName, groupChatStatus, memberIds]); // Update when any prop changes!
  async function handleSubmit(values: GroupChatEditDialogValues) {
    setLoading(true);
    try {
      const res = await fetch(`/api/network/group-chats/${groupChatId}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: values.name,
          status: values.status,
          users: values.members,
        }),
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || "Failed to update group chat.");
        return;
      }
      toast.success("Group chat updated!");
      refetchGroupChats?.();
    } catch (err: any) {
      toast.error(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  // Watch selected member count
  const membersSelected =
    useWatch({ control: form.control, name: "members" }) ?? [];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          size={"sm"}
          onClick={() => {
            if (onEdit) onEdit();
          }}
        >
          Edit
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Group Chat</DialogTitle>
        </DialogHeader>
        {usersLoadingNetwork ? (
          <Spinner />
        ) : (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-4"
              autoComplete="off"
            >
              <GlobalFormField
                form={form}
                fieldName="name"
                label={"Group Name"}
                required
                type="text"
                placeholder="Enter group chat name"
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={loading}
                        className={`${
                          field.value
                            ? "bg-green-600 data-[state=checked]:bg-green-600"
                            : "bg-red-500 data-[state=unchecked]:bg-red-500"
                        }`}
                      >
                        Active
                      </Switch>
                    </FormControl>
                    <FormDescription>
                      Toggle whether the group chat is active or inactive.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="mb-2">
                <Label className="font-bold">
                  Current Members: <Badge>{membersSelected.length}</Badge>
                </Label>
              </div>
              <Controller
                control={form.control}
                name="members"
                render={({ field, fieldState }) => (
                  <MultiSelectExpandable
                    isLoading={usersLoadingNetwork}
                    items={options}
                    valueField="value"
                    labelField="label"
                    tooltipField="tooltip"
                    disabled={loading}
                    selectedValues={field.value || []}
                    onValuesChange={field.onChange}
                    placeholder="Add/Remove Members"
                    maxShownItems={6}
                    fullWidth={true}
                    className={
                      "rounded-md " +
                      (fieldState.error
                        ? "border-destructive focus:ring-destructive"
                        : "border-input")
                    }
                  />
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Spinner /> Saving...
                    </>
                  ) : (
                    "Save Changes"
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

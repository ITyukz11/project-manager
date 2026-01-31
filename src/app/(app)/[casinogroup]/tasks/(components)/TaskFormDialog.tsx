"use client";

import * as React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
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
import { GlobalFormField } from "@/components/common/form";
import { toast } from "sonner";
import {
  avoidDefaultDomBehavior,
  handleKeyDown,
} from "@/lib/utils/dialogcontent.utils";
import { useParams } from "next/navigation";
import { useUsers } from "@/lib/hooks/swr/user/useUsersData";
import { useTask } from "@/lib/hooks/swr/task/useTask";
import { DateRange } from "react-day-picker";

// Zod schema for Task form
const TaskFormSchema = z.object({
  subject: z.string().min(1, "Subject required"),
  details: z.string().min(1, "Details required"),
  users: z.array(z.string()).optional(), // user IDs
  attachment: z.any().optional(),
});

export type TaskFormValues = z.infer<typeof TaskFormSchema>;

export function TaskFormDialog({
  open,
  onOpenChange,
  onSubmitted,
  refetch,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitted?: () => void;
  refetch: () => void;
}) {
  const [loading, setLoading] = React.useState(false);
  const params = useParams();
  const casinoGroup = params.casinogroup as string;

  // Fetch network users to be assigned to the group chat
  const { usersData, usersLoading } = useUsers();

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(TaskFormSchema),
    defaultValues: {
      subject: "",
      details: "",
      attachment: [],
      users: [],
    },
  });

  React.useEffect(() => {
    if (open) form.reset();
  }, [open, form]);

  async function handleSubmit(values: TaskFormValues) {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("subject", values.subject);
      formData.append("details", values.details);
      formData.append("casinoGroup", casinoGroup); // Add the actual casinoGroup value here
      formData.append(
        "users",
        JSON.stringify(values.users || []), // Send as JSON string
      );

      if (values.attachment && Array.isArray(values.attachment)) {
        values.attachment.forEach((file) => {
          formData.append("attachment", file); // All with the same key
        });
      }

      const res = await fetch("/api/task", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data?.error || "Task request failed!");
        return;
      }

      toast.success("Task request submitted successfully!");
      // Optionally, reset form or close dialog
      form.reset();
      onOpenChange(false);
      refetch();
      onSubmitted?.();
    } catch (e: any) {
      toast.error(e.message || "Something went wrong!");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onPointerDownOutside={avoidDefaultDomBehavior}
        onInteractOutside={avoidDefaultDomBehavior}
        onKeyDown={handleKeyDown}
        className="max-w-lg w-full px-4 py-2 md:p-6 overflow-y-auto overflow-visible"
        style={{ maxHeight: "90vh" }}
      >
        <DialogHeader>
          <DialogTitle>Submit Task</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <GlobalFormField
              form={form}
              fieldName="subject"
              label="Subject"
              required
              placeholder="Enter subject"
              type="text"
            />
            <GlobalFormField
              form={form}
              fieldName="details"
              label="Details"
              required
              placeholder="Enter task details"
              type="textarea"
              row={10}
            />
            <GlobalFormField
              form={form}
              fieldName="users"
              label="Users to Notify"
              required={false}
              type="multiselect"
              items={
                usersData === undefined
                  ? []
                  : usersData.map((user) => ({
                      label:
                        user.username + (user.role ? ` (${user.role})` : ""),
                      value: user.id,
                    }))
              }
              placeholder={
                usersLoading ? "Loading users..." : "Select users (optional)"
              }
            />
            <FormField
              control={form.control}
              name="attachment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Attachments{" "}
                    <span className="text-gray-500 font-light">(Optional)</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      multiple
                      accept="image/*,application/pdf"
                      disabled={loading}
                      onChange={(e) => {
                        // Store all selected files in field
                        field.onChange(Array.from(e.target.files ?? []));
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={loading}>
                {loading ? <Spinner /> : "Submit"}
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

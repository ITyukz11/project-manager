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
import { useConcerns } from "@/lib/hooks/swr/concern/useConcerns";
import { useUsers } from "@/lib/hooks/swr/user/useUsersData";
import { DateRange } from "react-day-picker";

// Zod schema for Concern form
const ConcernFormSchema = z.object({
  subject: z.string().min(1, "Subject required"),
  details: z.string().min(1, "Details required"),
  users: z.array(z.string()).optional(), // user IDs
  attachment: z.any().optional(),
});

export type ConcernFormValues = z.infer<typeof ConcernFormSchema>;

export function ConcernFormDialog({
  open,
  onOpenChange,
  onSubmitted,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitted?: () => void;
}) {
  const [loading, setLoading] = React.useState(false);
  const params = useParams();
  const casinoGroup = params.casinogroup as string;

  const STORAGE_KEY = `concerns-date-range:${casinoGroup}`;

  const dateRange: DateRange | undefined = React.useMemo(() => {
    const today = new Date();

    if (typeof window === "undefined") {
      return { from: today, to: today };
    }

    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return { from: today, to: today };
    }

    try {
      const parsed = JSON.parse(stored);
      return {
        from: parsed.from ? new Date(parsed.from) : today,
        to: parsed.to ? new Date(parsed.to) : today,
      };
    } catch {
      return { from: today, to: today };
    }
  }, [STORAGE_KEY]);

  const { refetch: mutate } = useConcerns(casinoGroup, dateRange);
  // Fetch network users to be assigned to the group chat
  const { usersData, usersLoading } = useUsers();

  const form = useForm<ConcernFormValues>({
    resolver: zodResolver(ConcernFormSchema),
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

  async function handleSubmit(values: ConcernFormValues) {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("subject", values.subject);
      formData.append("details", values.details);
      formData.append("casinoGroup", casinoGroup); // Add the actual casinoGroup value here
      formData.append(
        "users",
        JSON.stringify(values.users || []) // Send as JSON string
      );

      if (values.attachment && Array.isArray(values.attachment)) {
        values.attachment.forEach((file) => {
          formData.append("attachment", file); // All with the same key
        });
      }

      const res = await fetch("/api/concern", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data?.error || "Concern failed!");
        return;
      }

      toast.success("Concern request submitted successfully!");
      // Optionally, reset form or close dialog
      form.reset();
      onOpenChange(false);
      mutate();
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
          <DialogTitle>Request Concern</DialogTitle>
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
              placeholder="Enter concern details"
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

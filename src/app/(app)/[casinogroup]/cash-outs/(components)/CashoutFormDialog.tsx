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
import { useCashouts } from "@/lib/hooks/swr/cashout/useCashouts";
import { useParams } from "next/navigation";
import { PasteImageTextarea } from "@/lib/common/paste-image-textarea";
import { DateRange } from "react-day-picker";

// Zod schema for Cashout form
const CashoutFormSchema = z.object({
  userName: z.string().min(1, "Username required"),
  amount: z.number().min(1, "Amount required and must be greater than zero"),
  details: z.string().min(1, "Details required"),
  attachment: z.any().optional(),
});

export type CashoutFormValues = z.infer<typeof CashoutFormSchema>;

export function CashoutFormDialog({
  open,
  onOpenChange,
  onSubmitted,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitted?: () => void;
}) {
  const [loading, setLoading] = React.useState(false);
  const [pastedImages, setPastedImages] = React.useState<File[]>([]);

  const params = useParams();
  const casinoGroup = params.casinogroup as string;
  const STORAGE_KEY = `cashouts-date-range:${casinoGroup}`;

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

  const { refetch } = useCashouts(casinoGroup, dateRange);

  const form = useForm<CashoutFormValues>({
    resolver: zodResolver(CashoutFormSchema),
    defaultValues: {
      amount: 0,
      userName: "",
      details: "",
      attachment: [],
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset();
      setPastedImages([]);
    }
  }, [open, form]);

  async function handleSubmit(values: CashoutFormValues) {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("amount", String(values.amount));
      formData.append("userName", values.userName);
      formData.append("details", values.details);
      formData.append("casinoGroup", casinoGroup);

      // Add file input attachments
      if (values.attachment && Array.isArray(values.attachment)) {
        values.attachment.forEach((file) => {
          formData.append("attachment", file);
        });
      }

      // Add pasted images to attachments
      pastedImages.forEach((file) => {
        formData.append("attachment", file);
      });

      const res = await fetch("/api/cashout", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data?.error || "Cashout failed!");
        return;
      }

      toast.success("Cashout request submitted successfully!");
      form.reset();
      setPastedImages([]);
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
          <DialogTitle>Request Cashout</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <GlobalFormField
                form={form}
                fieldName="userName"
                label="Username"
                required
                placeholder="Enter username"
                type="text"
              />
              <GlobalFormField
                form={form}
                fieldName="amount"
                label="Amount"
                required
                placeholder="0. 00"
                type="amount"
              />
            </div>

            <FormField
              control={form.control}
              name="details"
              render={({ field, fieldState }) => (
                <FormItem className="sm:col-span-2">
                  <PasteImageTextarea
                    label="Details"
                    required
                    rows={10}
                    disabled={form.formState.isSubmitting || loading}
                    placeholder="Enter cashout details"
                    error={fieldState.error?.message}
                    pastedImages={pastedImages}
                    onPastedImagesChange={setPastedImages}
                    maxFileSize={5}
                    showPreviews={true}
                    previewGridCols={3}
                    {...field}
                  />
                </FormItem>
              )}
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
                        field.onChange(Array.from(e.target.files ?? []));
                      }}
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    Upload files or paste images in the details field above
                  </p>
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

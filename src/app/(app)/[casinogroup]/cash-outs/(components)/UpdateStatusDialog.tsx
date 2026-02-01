import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
} from "@/components/ui/form";
import {
  Select,
  SelectTrigger,
  SelectItem,
  SelectContent,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useCashoutById } from "@/lib/hooks/swr/cashout/useCashoutById";

export function UpdateStatusDialog({
  cashoutId,
  currentStatus,
  externalUserId,
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { cashout, mutate } = useCashoutById(cashoutId);

  // 1. Setup react-hook-form
  const form = useForm({
    defaultValues: {
      status: currentStatus, // enum string
    },
  });

  const statuses = ["PENDING", "PARTIAL", "COMPLETED", "REJECTED"];

  // 2. Submission handler (native form submit)
  async function onSubmit(values) {
    setLoading(true);

    try {
      // Use FormData instead of JSON
      const form = new FormData();
      form.append("status", values.status);

      if (externalUserId) {
        form.append("externalUserId", externalUserId);
      }

      const res = await fetch(`/api/cashout/${cashoutId}/status`, {
        method: "PATCH",
        body: form,
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Status updated!");
        setOpen(false);
        mutate();
      } else {
        toast.error(data.error || "Failed to update status");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Update Status</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Cashout Status</DialogTitle>
        </DialogHeader>
        {/* 3. Use Form from shadcn/ui */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="status"
              rules={{ required: true }} // optional validation
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Pick a status…" />
                      </SelectTrigger>
                      <SelectContent>
                        {statuses.map((s) => {
                          if (
                            (cashout?.commissionId ||
                              cashout?.transactionRequestId) &&
                            s === "REJECTED"
                          )
                            return;

                          return (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </FormControl>
                </FormItem>
              )}
            />
            <Button
              className="w-full"
              type="submit"
              disabled={loading || !form.watch("status")}
            >
              {loading ? "Updating..." : "Confirm"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

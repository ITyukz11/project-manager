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
import { useCashinById } from "@/lib/hooks/swr/cashin/useCashinById";
import { useBalance } from "@/lib/hooks/swr/qbet88/useBalance";

export function UpdateStatusDialog({
  cashinId,
  currentStatus,
  externalUserId,
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { mutate } = useCashinById(cashinId);
  const { refreshBalance } = useBalance("NEFTUAO2A0LHYYXO");
  // 1. Setup react-hook-form
  const form = useForm({
    defaultValues: {
      status: currentStatus, // enum string
    },
  });

  const statuses = ["COMPLETED", "REJECTED", "ACCOMMODATING"];

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

      // If you have a file, add that here too
      // if (values.receipt) {
      //   form.append("receipt", values.receipt);
      // }

      const res = await fetch(`/api/cashin/${cashinId}/status`, {
        method: "PATCH",
        body: form, // No need for Content-Type, fetch will set it automatically
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Status updated!");
        setOpen(false);
        mutate();
        refreshBalance();
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
          <DialogTitle>Update Cashin Status</DialogTitle>
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
                        {statuses.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
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

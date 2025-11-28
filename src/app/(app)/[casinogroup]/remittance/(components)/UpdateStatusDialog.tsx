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
import { useRemittanceById } from "@/lib/hooks/swr/remittance/useRemittanceById";

export function UpdateStatusDialog({ remittanceId, currentStatus }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { mutate } = useRemittanceById(remittanceId);

  // 1. Setup react-hook-form
  const form = useForm({
    defaultValues: {
      status: currentStatus, // enum string
    },
  });

  const statuses = ["PENDING", "COMPLETED", "REJECTED"];

  // 2. Submission handler (native form submit)
  async function onSubmit(values) {
    setLoading(true);
    try {
      const res = await fetch(`/api/remittance/${remittanceId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: values.status }),
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
          <DialogTitle>Update Remittance Status</DialogTitle>
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

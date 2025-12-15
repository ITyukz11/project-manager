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
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { GlobalFormField } from "@/components/common/form";
import { toast } from "sonner";
import {
  avoidDefaultDomBehavior,
  handleKeyDown,
} from "@/lib/utils/dialogcontent.utils";
import { useReadyCheckTimer } from "@/lib/context/ReadyCheckTimerContext";

// Zod schema for Ready Check timer form
const ReadyCheckTimerSchema = z.object({
  timer: z.string().min(1, "Timer required and must be greater than zero"),
});

export type ReadyCheckTimerValues = z.infer<typeof ReadyCheckTimerSchema>;

export function ReadyCheckTimerDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [loading, setLoading] = React.useState(false);
  const { setTimerSeconds } = useReadyCheckTimer();

  const form = useForm<ReadyCheckTimerValues>({
    resolver: zodResolver(ReadyCheckTimerSchema),
    defaultValues: {
      timer: "",
    },
  });

  React.useEffect(() => {
    if (open) form.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function handleSubmit(values: ReadyCheckTimerValues) {
    setLoading(true);
    try {
      // save chosen timer into context so listeners/readers can pick it up
      setTimerSeconds(Number(values.timer));

      const res = await fetch("/api/ready-check/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Optionally include timer in request body if server is expected to persist/broadcast it.
        // If your server accepts a timer value, uncomment the next line and the body above:
        // body: JSON.stringify({ timer: Number(values.timer) }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          body?.error || body?.message || "Failed to start ready check"
        );
      }
      await res.json().catch(() => ({}));

      toast.success("Ready check started.");
      // close dialog
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.message || "Error starting ready check");
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
        className="max-w-sm w-xs"
      >
        <DialogHeader>
          <DialogTitle>Ready Check Timer</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <GlobalFormField
              form={form}
              fieldName="timer"
              label="Timer (seconds)"
              required
              placeholder="30"
              type="number"
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

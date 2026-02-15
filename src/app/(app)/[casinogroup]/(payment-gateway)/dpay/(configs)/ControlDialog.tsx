"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CashoutDialog } from "./CashoutDialog";
import { useDpayConfig } from "@/lib/hooks/swr/dpay/config/useDpayConfig";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ArrowLeftRight, Wallet } from "lucide-react";

interface ControlDialogProps {
  open: boolean;
  onOpenChange: () => void;
  casinoGroup: string;
}

export default function ControlDialog({
  open,
  onOpenChange,
  casinoGroup,
}: ControlDialogProps) {
  const { config, isLoading, isError, mutate } = useDpayConfig(casinoGroup);
  const [cashoutOpen, setCashoutOpen] = React.useState(false);
  const [isToggling, setIsToggling] = React.useState(false);

  const isCashinEnabled = config?.cashinGatewayEnabled;

  const toggleCashin = async () => {
    if (!config) return;

    setIsToggling(true);

    try {
      const res = await fetch("/api/dpay/config/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          casinoGroupName: casinoGroup,
          enabled: !isCashinEnabled,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to toggle DPAY cash-in");
      }
      toast.success(
        `DPAY Gateway Cash-in ${!isCashinEnabled ? "enabled" : "disabled"} successfully`,
      );

      // ✅ Re-fetch from server AFTER success
      await mutate();
    } catch (err) {
      console.error(err);
      toast.error("Failed to toggle DPAY cash-in");
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>DPAY Controls</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            {/* Cashin Killswitch */}
            <Button
              disabled={isLoading || isError || isToggling}
              variant={!isCashinEnabled ? "default" : "destructive"}
              onClick={toggleCashin}
            >
              {isLoading && "Loading…"}
              {isToggling && "Saving…"}
              {isError && "Error!"}
              {!isLoading && !isToggling && !isError && (
                <span className="flex items-center gap-2">
                  {!isCashinEnabled && (
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                    </span>
                  )}
                  {!isCashinEnabled
                    ? "Disable Cash-in Gateway"
                    : "Enable Cash-in Gateway"}
                </span>
              )}
              <ArrowLeftRight />
            </Button>

            {/* Cashout */}
            <Button
              variant={"secondary"}
              onClick={() => {
                onOpenChange();
                setCashoutOpen(true);
              }}
            >
              <Wallet /> Cashout
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <CashoutDialog
        open={cashoutOpen}
        onOpenChange={() => setCashoutOpen(false)}
      />
    </>
  );
}

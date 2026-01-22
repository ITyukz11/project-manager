"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cashoutBanks } from "./cashoutdata";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";

interface CashoutDialogProps {
  open: boolean;
  onOpenChange: () => void;
}

export function CashoutDialog({ open, onOpenChange }: CashoutDialogProps) {
  const [form, setForm] = React.useState({
    Amount: 0,
    ReferenceUserId: "CPA7DMZL98ZBHP46",
    AccountNumber: "",
    HolderName: "",
    Bank: "",
    BankCode: "PH_GXI",
    BankAccountType: "PERSONAL",
    RecipientMobileNumber: "",
  });

  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string[]>>({});

  React.useEffect(() => {
    if (!open) {
      // Reset form and result when dialog is closed
      setForm({
        Amount: 0,
        ReferenceUserId: "CPA7DMZL98ZBHP46",
        AccountNumber: "",
        HolderName: "",
        Bank: "",
        BankCode: "",
        BankAccountType: "PERSONAL",
        RecipientMobileNumber: "",
      });
      setResult(null);
      setErrors({});
    }
  }, [open]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleBankSelect = (bankCode: string) => {
    const selectedBank = cashoutBanks.find((bank) => bank.Code === bankCode);

    if (!selectedBank) return;

    setForm((prev) => ({
      ...prev,
      Bank: selectedBank.Name,
      BankCode: selectedBank.Code,
    }));
  };

  console.log("result: ", result);
  const handleCreateCashout = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/droplet/payment/create-cashout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.errors) {
          setErrors(data.errors);
          toast.error("Please fix the highlighted errors.");
          return; // ⛔ STOP HERE
        }

        throw new Error(data.title);
      }

      // ✅ success-only path
      setResult(data);
      toast.success("Cashout created successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to create cash-out");
    } finally {
      setLoading(false);
    }
  };

  function ResultRow({
    label,
    value,
  }: {
    label: string;
    value: React.ReactNode;
  }) {
    return (
      <div className="grid grid-cols-5 gap-4 items-start text-sm">
        <div className="text-muted-foreground wrap-break-word">{label}</div>
        <div className="font-medium col-span-4 wrap-break-word">{value}</div>
      </div>
    );
  }

  function renderValue(value: any): React.ReactNode {
    if (Array.isArray(value)) {
      return (
        <ul className="list-disc list-inside space-y-1">
          {value.map((v, i) => (
            <li key={i}>{String(v)}</li>
          ))}
        </ul>
      );
    }

    if (typeof value === "object" && value !== null) {
      return (
        <pre className="text-xs whitespace-pre-wrap rounded-md bg-background p-2 border">
          {JSON.stringify(value, null, 2)}
        </pre>
      );
    }

    return <span>{String(value)}</span>;
  }

  function CashoutResultView({
    result,
    onClose,
  }: {
    result: Record<string, any>;
    onClose: () => void;
  }) {
    return (
      <div className="space-y-6 py-4">
        <div className="rounded-lg border bg-muted p-4 max-h-[60vh] overflow-auto">
          <div className="grid gap-3">
            {Object.entries(result).map(([key, value]) => (
              <ResultRow key={key} label={key} value={renderValue(value)} />
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Request Cashout</DialogTitle>
          <DialogDescription>
            Fill in the required information below to request a cashout.
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <div className="grid gap-4 py-4">
            <div className="grid w-full items-center gap-1.5">
              <Label>Bank</Label>

              <Select
                value={form.BankCode || ""}
                onValueChange={handleBankSelect}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a bank" />
                </SelectTrigger>

                <SelectContent>
                  {cashoutBanks
                    .filter((b) => b.Status)
                    .map((bank) => (
                      <SelectItem key={bank.Code} value={bank.Code}>
                        {bank.Name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="AccountNumber">Account Number</Label>
              <Input
                id="AccountNumber"
                name="AccountNumber"
                value={form.AccountNumber}
                onChange={handleChange}
              />
            </div>

            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="HolderName">Holder Name</Label>
              <Input
                id="HolderName"
                name="HolderName"
                value={form.HolderName}
                onChange={handleChange}
              />
            </div>
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="Amount">Amount</Label>
              <Input
                id="Amount"
                type="number"
                name="Amount"
                value={form.Amount}
                onChange={handleChange}
              />
            </div>

            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="RecipientMobileNumber">
                Recipient Mobile Number
              </Label>
              <Input
                id="RecipientMobileNumber"
                name="RecipientMobileNumber"
                value={form.RecipientMobileNumber}
                onChange={handleChange}
              />
            </div>

            <Button onClick={handleCreateCashout} disabled={loading}>
              {loading ? <Spinner /> : "Request Cashout"}
            </Button>

            {result && (
              <pre className="mt-2 text-sm bg-gray-100 p-2 rounded text-left">
                {JSON.stringify(result, null, 2)}
              </pre>
            )}
          </div>
        ) : (
          <CashoutResultView
            result={result}
            onClose={() => {
              onOpenChange();
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

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
import { BankNames } from "@/lib/data";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover-dialog";
import { Check, ChevronsUpDown } from "lucide-react";
import { GlobalFormField } from "@/components/common/form";
import { toast } from "sonner";
import { useGroupChats } from "@/lib/hooks/swr/network/useGroupChat";
import {
  avoidDefaultDomBehavior,
  handleKeyDown,
} from "@/lib/utils/dialogcontent.utils";
import { useCashouts } from "@/lib/hooks/swr/cashout/useCashouts";

// Zod schema for Cashout form
const CashoutFormSchema = z.object({
  userName: z.string().min(1, "Username required"),
  amount: z.number().min(1, "Amount required and must be greater than zero"),
  mop: z.string().min(1, "Mode of Payment required"),
  accName: z.string().min(1, "Account Name required"),
  accNumber: z.string().min(1, "Account Number required"),
  bankName: z.string().min(1, "Bank Name required"),
  loaderTip: z.number().min(0, "Loader Tip cannot be negative"),
  agentTip: z.number().min(0, "Agent Tip cannot be negative"),
  masterAgentTip: z.number().min(0, "Master Agent Tip cannot be negative"),
  // Only validate in frontend, will handle proper upload in backend
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
  const [openSearchBank, setOpenSearchBank] = React.useState(false);
  const { mutate } = useCashouts();

  const form = useForm<CashoutFormValues>({
    resolver: zodResolver(CashoutFormSchema),
    defaultValues: {
      amount: 0,
      userName: "",
      mop: "",
      accName: "",
      accNumber: "",
      bankName: "",
      loaderTip: 0,
      agentTip: 0,
      masterAgentTip: 0,
      attachment: [],
    },
  });

  React.useEffect(() => {
    if (open) form.reset();
  }, [open, form]);

  async function handleSubmit(values: CashoutFormValues) {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("amount", String(values.amount));
      formData.append("userName", values.userName);
      formData.append("mop", values.mop);
      formData.append("accName", values.accName);
      formData.append("accNumber", values.accNumber);
      formData.append("bankName", values.bankName);
      formData.append("loaderTip", String(values.loaderTip));
      formData.append("agentTip", String(values.agentTip));
      formData.append("masterAgentTip", String(values.masterAgentTip));
      if (values.attachment && Array.isArray(values.attachment)) {
        values.attachment.forEach((file) => {
          formData.append("attachment", file); // All with the same key
        });
      }

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
                fieldName="amount"
                label="Amount"
                required
                placeholder="0.00"
                type="amount"
              />
              <GlobalFormField
                form={form}
                fieldName="userName"
                label="Username"
                required
                placeholder="Enter username"
                type="text"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <GlobalFormField
                form={form}
                fieldName="accName"
                label="Account Name"
                required
                type="text"
                placeholder="Enter account name"
              />
              <GlobalFormField
                form={form}
                fieldName="accNumber"
                label="Account Number"
                required
                type="text"
                placeholder="Enter account number"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <GlobalFormField
                form={form}
                fieldName="mop"
                label="Mode of Payment"
                required
                placeholder="Enter mode of payment"
                type="text"
              />
              <FormField
                control={form.control}
                name="bankName"
                render={({ field }) => {
                  const banks = BankNames.filter((b) => b.type === "BANK");
                  const wallets = BankNames.filter((b) => b.type === "EWALLET");
                  return (
                    <FormItem>
                      <FormLabel>Bank Name / E-Wallet</FormLabel>
                      <FormControl>
                        <Popover
                          open={openSearchBank}
                          onOpenChange={setOpenSearchBank}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={openSearchBank}
                              disabled={loading}
                              className={cn(
                                "w-full justify-between font-normal",
                                !form.watch().bankName &&
                                  "text-muted-foreground"
                              )}
                            >
                              {field.value
                                ? BankNames.find(
                                    (bank) => bank.name === field.value
                                  )?.name
                                : "Select Bank or E-Wallet"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50 shrink-0" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0 max-h-[300px]">
                            <Command>
                              <CommandInput
                                placeholder="Search bank or e-wallet..."
                                className="h-9"
                              />
                              <CommandList>
                                <CommandEmpty>No options found.</CommandEmpty>
                                {banks.length > 0 && (
                                  <CommandGroup heading="Banks">
                                    {banks.map((bank) => (
                                      <CommandItem
                                        key={bank.name}
                                        value={bank.name}
                                        onSelect={() => {
                                          field.onChange(bank.name);
                                          setOpenSearchBank(false);
                                        }}
                                      >
                                        {bank.name}
                                        <Check
                                          className={cn(
                                            "ml-auto h-4 w-4",
                                            field.value === bank.name
                                              ? "opacity-100"
                                              : "opacity-0"
                                          )}
                                        />
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                )}
                                {wallets.length > 0 && (
                                  <CommandGroup heading="E-Wallets">
                                    {wallets.map((wallet) => (
                                      <CommandItem
                                        key={wallet.name}
                                        value={wallet.name}
                                        onSelect={() => {
                                          field.onChange(wallet.name);
                                          setOpenSearchBank(false);
                                        }}
                                      >
                                        {wallet.name}
                                        <Check
                                          className={cn(
                                            "ml-auto h-4 w-4",
                                            field.value === wallet.name
                                              ? "opacity-100"
                                              : "opacity-0"
                                          )}
                                        />
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                )}
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            </div>

            <FormField
              control={form.control}
              name="attachment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Attachments</FormLabel>
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
            <div className="flex flex-col md:flex-row gap-4">
              <GlobalFormField
                form={form}
                fieldName="loaderTip"
                label="Loader Tip"
                placeholder="0.00"
                type="amount"
              />

              <GlobalFormField
                form={form}
                fieldName="agentTip"
                label="Agent Tip"
                placeholder="0.00"
                type="amount"
              />
              <GlobalFormField
                form={form}
                fieldName="masterAgentTip"
                label="MA Tip"
                placeholder="0.00"
                type="amount"
              />
            </div>

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

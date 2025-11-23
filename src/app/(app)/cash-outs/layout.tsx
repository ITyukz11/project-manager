"use client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CashoutFormDialog } from "./(components)/CashoutFormDialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { CreditCard } from "lucide-react";

export default function CashoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-row justify-between">
          <h1 className="text-3xl font-bold">Cashouts</h1>
          <Button onClick={() => setOpen(true)}>
            {" "}
            <CreditCard className="mr-2" /> Request Cashout
          </Button>
        </CardTitle>
        <span className="text-muted-foreground text-sm">
          Manage your cashout requests and history here.
        </span>
      </CardHeader>
      <CardContent>
        <section>{children}</section>
      </CardContent>
      <CashoutFormDialog open={open} onOpenChange={setOpen} />
    </Card>
  );
}

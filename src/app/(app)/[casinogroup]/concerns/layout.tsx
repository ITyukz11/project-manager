"use client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ConcernFormDialog } from "./(components)/ConcernFormDialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { MessageCircleWarning } from "lucide-react";

export default function ConcernLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-row justify-between">
          <h1 className="text-3xl font-bold">Concerns</h1>
          <Button onClick={() => setOpen(true)}>
            {" "}
            <MessageCircleWarning /> Submit Concern
          </Button>
        </CardTitle>
        <span className="text-muted-foreground text-sm">
          Raise a concern regarding any issues or discrepancies you have
          noticed.
        </span>
      </CardHeader>
      <CardContent>
        <section>{children}</section>
      </CardContent>
      <ConcernFormDialog open={open} onOpenChange={setOpen} />
    </Card>
  );
}

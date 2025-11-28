"use client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TaskFormDialog } from "./(components)/TaskFormDialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Clipboard } from "lucide-react";

export default function RemittanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-row justify-between">
          <h1 className="text-3xl font-bold">Task</h1>
          <Button onClick={() => setOpen(true)}>
            <Clipboard /> Submit Task
          </Button>
        </CardTitle>
        <span className="text-muted-foreground text-sm">
          Track task requests for your casino group.
        </span>
      </CardHeader>
      <CardContent>
        <section>{children}</section>
      </CardContent>
      <TaskFormDialog open={open} onOpenChange={setOpen} />
    </Card>
  );
}

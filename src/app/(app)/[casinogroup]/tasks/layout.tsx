"use client";
import { Card, CardContent } from "@/components/ui/card";
import { TaskFormDialog } from "./(components)/TaskFormDialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Clipboard } from "lucide-react";
import { Title } from "@/components/Title";
import { useTask } from "@/lib/hooks/swr/task/useTask";
import { useParams } from "next/navigation";
import { useStoredDateRange } from "@/lib/hooks/useStoredDateRange";

export default function TasksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const params = useParams();
  const casinoGroup = params.casinogroup as string;

  const STORAGE_KEY = `tasks-date-range:${casinoGroup}`;

  const { dateRange } = useStoredDateRange(STORAGE_KEY);

  const { lastUpdate, isLoading, error } = useTask(casinoGroup, dateRange);
  return (
    <Card>
      <CardContent>
        <Title
          title={`${casinoGroup?.toLocaleString().toUpperCase()} Tasks`}
          subtitle="Track task requests for your casino group."
          lastUpdate={lastUpdate}
          isRefreshing={isLoading}
          icon={
            <Clipboard className="h-5 w-5 md:h-6 md:w-6 text-green-600 dark:text-green-400" />
          }
          live
          error={error}
          right={
            <Button onClick={() => setOpen(true)} size={"sm"}>
              <Clipboard /> <span className="hidden sm:block">Submit Task</span>
            </Button>
          }
        />
        <section>{children}</section>
      </CardContent>
      <TaskFormDialog open={open} onOpenChange={setOpen} />
    </Card>
  );
}

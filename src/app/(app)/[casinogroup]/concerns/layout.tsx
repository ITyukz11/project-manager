"use client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ConcernFormDialog } from "./(components)/ConcernFormDialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Title } from "@/components/Title";
import { useConcerns } from "@/lib/hooks/swr/concern/useConcerns";
import { MessageCircleWarning } from "lucide-react";
import { useParams } from "next/navigation";

export default function ConcernLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const params = useParams();
  const casinoGroup = params.casinogroup as string;
  const { lastUpdate, isLoading, error } = useConcerns(casinoGroup);
  return (
    <Card>
      <CardContent>
        <Title
          title={`${casinoGroup?.toLocaleString().toUpperCase()} Concerns`}
          subtitle="Raise a concern regarding any issues or discrepancies you have
          noticed."
          lastUpdate={lastUpdate}
          isRefreshing={isLoading}
          icon={
            <MessageCircleWarning className="h-5 w-5 md:h-6 md:w-6 text-green-600 dark:text-green-400" />
          }
          live
          error={error}
          right={
            <Button onClick={() => setOpen(true)} size={"sm"}>
              <MessageCircleWarning />{" "}
              <span className="hidden sm:block">Submit Concern</span>
            </Button>
          }
        />
        <section>{children}</section>
      </CardContent>
      <ConcernFormDialog open={open} onOpenChange={setOpen} />
    </Card>
  );
}

"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Title } from "@/components/Title";
import { MessageCircleWarning } from "lucide-react";
import { useParams } from "next/navigation";
import { useCustomerSupports } from "@/lib/hooks/swr/customer-support/useCustomerSupports";
import { CustomerSupportFormDialog } from "./(components)/CustomerSupportFormDialog";

export default function ConcernLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const params = useParams();
  const casinoGroup = params.casinogroup as string;
  const { lastUpdate, isLoading, error } = useCustomerSupports(casinoGroup);
  return (
    <Card>
      <CardContent>
        <Title
          title={`${casinoGroup
            ?.toLocaleString()
            .toUpperCase()} Customer Support`}
          subtitle="These are the list of customer support tickets."
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
      <CustomerSupportFormDialog open={open} onOpenChange={setOpen} />
    </Card>
  );
}

"use client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { RemittanceFormDialog } from "./(components)/RemittanceFormDialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { BanknoteArrowUp } from "lucide-react";
import { Title } from "@/components/Title";
import { useRemittance } from "@/lib/hooks/swr/remittance/useRemittance";
import { useParams } from "next/navigation";

export default function RemittanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const params = useParams();
  const casinoGroup = params.casinogroup as string;
  const { lastUpdate, isLoading, error } = useRemittance(casinoGroup);
  return (
    <Card>
      <CardContent>
        <Title
          title={`${casinoGroup?.toLocaleString().toUpperCase()} Remittances`}
          subtitle="Track your remittance submissions and history here."
          lastUpdate={lastUpdate}
          isRefreshing={isLoading}
          icon={
            <BanknoteArrowUp className="h-5 w-5 md:h-6 md:w-6 text-green-600 dark:text-green-400" />
          }
          live
          error={error}
          right={
            <Button onClick={() => setOpen(true)} size={"sm"}>
              <BanknoteArrowUp />{" "}
              <span className="hidden sm:block">Submit Remittance</span>
            </Button>
          }
        />
        <section>{children}</section>
      </CardContent>
      <RemittanceFormDialog open={open} onOpenChange={setOpen} />
    </Card>
  );
}

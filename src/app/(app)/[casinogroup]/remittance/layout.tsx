"use client";
import { Card, CardContent } from "@/components/ui/card";
import { RemittanceFormDialog } from "./(components)/RemittanceFormDialog";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { BanknoteArrowUp, Wallet } from "lucide-react";
import { Title } from "@/components/Title";
import { useRemittance } from "@/lib/hooks/swr/remittance/useRemittance";
import { useParams } from "next/navigation";
import { DateRange } from "react-day-picker";

export default function RemittanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const params = useParams();
  const casinoGroup = params.casinogroup as string;

  /**
   * 🔑 Per-casinoGroup storage key
   */
  const STORAGE_KEY = `remittance-date-range:${casinoGroup}`;

  /**
   * ✅ Lazy initialize dateRange from localStorage
   */
  const [dateRange] = useState<DateRange | undefined>(() => {
    const today = new Date();

    if (typeof window === "undefined") {
      return { from: today, to: today };
    }

    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return { from: today, to: today };
    }

    try {
      const parsed = JSON.parse(stored);
      return {
        from: parsed.from ? new Date(parsed.from) : today,
        to: parsed.to ? new Date(parsed.to) : today,
      };
    } catch {
      return { from: today, to: today };
    }
  });

  /**
   * ✅ Persist dateRange to localStorage
   */
  useEffect(() => {
    if (!dateRange) return;

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        from: dateRange.from?.toISOString(),
        to: dateRange.to?.toISOString(),
      }),
    );
  }, [dateRange, STORAGE_KEY]);

  const { lastUpdate, error, isLoading, refetch } = useRemittance(
    casinoGroup,
    dateRange,
  );
  return (
    <Card>
      <CardContent>
        <Title
          title={`${casinoGroup?.toLocaleString().toUpperCase()} Remittances`}
          subtitle="Track your remittance submissions and history here."
          lastUpdate={lastUpdate}
          isRefreshing={isLoading}
          icon={
            <Wallet className="h-5 w-5 md:h-6 md:w-6 text-green-600 dark:text-green-400" />
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
      <RemittanceFormDialog
        open={open}
        onOpenChange={setOpen}
        refetch={refetch}
      />
    </Card>
  );
}

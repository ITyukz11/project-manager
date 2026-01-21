"use client";
import { Card, CardContent } from "@/components/ui/card";
import { CashoutFormDialog } from "./(components)/CashoutFormDialog";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { BanknoteArrowUp, CreditCard } from "lucide-react";
import { useCashouts } from "@/lib/hooks/swr/cashout/useCashouts";
import { useParams } from "next/navigation";
import { Title } from "@/components/Title";
import { DateRange } from "react-day-picker";

export default function CashoutLayout({
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
  const STORAGE_KEY = `cashouts-date-range:${casinoGroup}`;

  /**
   * ✅ Lazy initialize dateRange from localStorage
   * (No useEffect, no cascading renders)
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

  /**
   * ✅ Fetch cashouts using dateRange
   */
  const { lastUpdate, error, isLoading } = useCashouts(casinoGroup, dateRange);

  return (
    <Card>
      <CardContent>
        <Title
          title={`${casinoGroup?.toLocaleString().toUpperCase()} Cashouts`}
          subtitle="Manage your cashout requests and history here."
          lastUpdate={lastUpdate}
          isRefreshing={isLoading}
          icon={
            <BanknoteArrowUp className="h-5 w-5 md:h-6 md:w-6 text-green-600 dark:text-green-400" />
          }
          live
          error={error}
          right={
            <Button onClick={() => setOpen(true)} size={"sm"}>
              <CreditCard />{" "}
              <span className="hidden sm:block">Request Cashout</span>
            </Button>
          }
        />
        <section>{children}</section>
      </CardContent>
      <CashoutFormDialog open={open} onOpenChange={setOpen} />
    </Card>
  );
}

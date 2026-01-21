"use client";
import { Card, CardContent } from "@/components/ui/card";
import { ConcernFormDialog } from "./(components)/ConcernFormDialog";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Title } from "@/components/Title";
import { useConcerns } from "@/lib/hooks/swr/concern/useConcerns";
import { MessageCircleWarning } from "lucide-react";
import { useParams } from "next/navigation";
import { DateRange } from "react-day-picker";

export default function ConcernLayout({
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
  const STORAGE_KEY = `concerns-date-range:${casinoGroup}`;

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
   * ✅ Fetch concerns using dateRange
   */
  const { lastUpdate, error, isLoading } = useConcerns(casinoGroup, dateRange);

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

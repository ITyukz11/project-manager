"use client";
import { Card, CardContent } from "@/components/ui/card";
import { BanknoteArrowUp } from "lucide-react";
import { useCommissions } from "@/lib/hooks/swr/commission/useCommissions";
import { useParams } from "next/navigation";
import { Title } from "@/components/Title";
import { useStoredDateRange } from "@/lib/hooks/useStoredDateRange";

export default function CommissionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const casinoGroup = params.casinogroup as string;

  /**
   * 🔑 Per-casinoGroup storage key
   */
  const STORAGE_KEY = `commissions-date-range:${casinoGroup}`;

  /**
   * ✅ Lazy initialize dateRange from localStorage
   * (No useEffect, no cascading renders)
   */
  const { dateRange } = useStoredDateRange(STORAGE_KEY);

  /**
   * ✅ Fetch commissions using dateRange
   */
  const { lastUpdate, error, isLoading } = useCommissions(
    casinoGroup,
    dateRange,
  );

  return (
    <Card>
      <CardContent>
        <Title
          title={`${casinoGroup?.toLocaleString().toUpperCase()} Commissions`}
          subtitle="See all commission requests and history here."
          lastUpdate={lastUpdate}
          isRefreshing={isLoading}
          icon={
            <BanknoteArrowUp className="h-5 w-5 md:h-6 md:w-6 text-green-600 dark:text-green-400" />
          }
          live
          error={error}
        />
        <section>{children}</section>
      </CardContent>
    </Card>
  );
}

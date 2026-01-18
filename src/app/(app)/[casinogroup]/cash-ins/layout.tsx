"use client";
import { Card, CardContent } from "@/components/ui/card";
import { CashinFormDialog } from "./(components)/CashinFormDialog";
import { useEffect, useState } from "react";
import { BanknoteArrowDown } from "lucide-react";
import { useParams } from "next/navigation";
import { Title } from "@/components/Title";
import { useCashins } from "@/lib/hooks/swr/cashin/useCashins";
import { DateRange } from "react-day-picker";
import { useStoredDateRange } from "@/lib/hooks/useStoredDateRange";

export default function CashinLayout({
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
  const STORAGE_KEY = `cashins-date-range:${casinoGroup}`;

  /**
   * ✅ Lazy initialize dateRange from localStorage
   */
  const { dateRange } = useStoredDateRange(STORAGE_KEY);
  /**
   * ✅ Fetch cashins using dateRange
   */
  const { lastUpdate, error, isLoading } = useCashins(casinoGroup, dateRange);

  return (
    <Card>
      <CardContent>
        <Title
          title={`${casinoGroup?.toLocaleString().toUpperCase()} Cashins`}
          subtitle="Manage your cash requests and history here."
          lastUpdate={lastUpdate}
          isRefreshing={isLoading}
          icon={
            <BanknoteArrowDown className="h-5 w-5 md:h-6 md:w-6 text-green-600 dark:text-green-400" />
          }
          live
          error={error}
        />
        <section>{children}</section>
      </CardContent>
      <CashinFormDialog open={open} onOpenChange={setOpen} />
    </Card>
  );
}

import { useEffect, useState } from "react";
import type { DateRange } from "react-day-picker";
import { getTodayRange, parseStoredDateRange } from "@/lib/date-range";

export function useStoredDateRange(storageKey: string) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    if (typeof window === "undefined") {
      return getTodayRange(); // SSR fallback
    }

    const stored = localStorage.getItem(storageKey);

    // If nothing is stored, default to today
    if (!stored) {
      return getTodayRange();
    }

    return parseStoredDateRange(stored) ?? getTodayRange();
  });

  useEffect(() => {
    if (!dateRange) return;

    localStorage.setItem(
      storageKey,
      JSON.stringify({
        from: dateRange.from?.toISOString(),
        to: dateRange.to?.toISOString(),
      }),
    );
  }, [dateRange, storageKey]);

  return { dateRange, setDateRange };
}

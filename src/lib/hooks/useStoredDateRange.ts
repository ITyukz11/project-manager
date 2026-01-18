import { useEffect, useState } from "react";
import type { DateRange } from "react-day-picker";
import { getTodayRange, parseStoredDateRange } from "../date-range";

export function useStoredDateRange(storageKey: string) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const today = getTodayRange();

    if (typeof window === "undefined") {
      return today;
    }

    const stored = localStorage.getItem(storageKey);
    return parseStoredDateRange(stored) ?? today;
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

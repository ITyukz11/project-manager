import type { DateRange } from "react-day-picker";

/**
 * Start of local day (00:00:00.000)
 */
export function startOfLocalDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

/**
 * End of local day (23:59:59.999)
 */
export function endOfLocalDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

/**
 * Returns today's full local date range
 */
export function getTodayRange(): DateRange {
  const now = new Date();
  return {
    from: startOfLocalDay(now),
    to: endOfLocalDay(now),
  };
}

/**
 * Safely parse a stored DateRange from localStorage
 */
export function parseStoredDateRange(
  stored: string | null,
): DateRange | undefined {
  if (!stored) return undefined;

  try {
    const parsed = JSON.parse(stored);
    return {
      from: parsed.from ? new Date(parsed.from) : undefined,
      to: parsed.to ? new Date(parsed.to) : undefined,
    };
  } catch {
    return undefined;
  }
}

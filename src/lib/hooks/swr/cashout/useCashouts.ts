import useSWR from "swr";
import { useState, useMemo } from "react";
import { pusherChannel } from "@/lib/pusher";
import { usePusher } from "../../use-pusher";
import { CashoutForTable } from "@/components/table/cashout/cashoutColumns";
import { DateRange } from "react-day-picker";

const fetcher = async (url: string) => {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch cashouts");
  return res.json();
};

export const useCashouts = (casinoGroup?: string, dateRange?: DateRange) => {
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // ✅ Depend on the full dateRange object
  const swrKey = useMemo(() => {
    const params = new URLSearchParams();

    if (casinoGroup) {
      params.set("casinoGroup", casinoGroup);
    }

    if (dateRange?.from) {
      params.set("from", dateRange.from.toISOString());
    }

    if (dateRange?.to) {
      params.set("to", dateRange.to.toISOString());
    }

    return `/api/cashout?${params.toString()}`;
  }, [casinoGroup, dateRange]); // <-- depends on full dateRange now

  const { data, error, isLoading, mutate } = useSWR<CashoutForTable[]>(
    swrKey,
    fetcher,
    {
      refreshInterval: 0,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 3000,
      shouldRetryOnError: true,
    }
  );

  usePusher<{
    cashoutId: string;
    action: "CREATED" | "APPROVED" | "REJECTED";
    timestamp: string;
  }>({
    channels: casinoGroup ? [pusherChannel.transactions(casinoGroup)] : [],
    eventName: "cashout-updated",
    onEvent: (payload) => {
      console.log("📢 Cashout updated:", payload);
      setLastUpdate(new Date(payload.timestamp));
      mutate();
    },
  });

  return {
    cashouts: data ?? [],
    error,
    isLoading,
    lastUpdate,
    refetch: mutate,
  };
};

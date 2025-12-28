import useSWR from "swr";
import { useState, useMemo } from "react";
import { pusherChannel } from "@/lib/pusher";
import { usePusher } from "../../use-pusher";
import { RemittanceForTable } from "@/components/table/remittance/remittanceColumns";
import { DateRange } from "react-day-picker";

// Simple fetcher function
const fetcher = async (url: string) => {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch remittances");
  return res.json();
};

export const useRemittance = (casinoGroup?: string, dateRange?: DateRange) => {
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Memoized URL with filters
  const swrKey = useMemo(() => {
    const params = new URLSearchParams();
    if (casinoGroup) params.set("casinoGroup", casinoGroup);
    if (dateRange?.from) params.set("from", dateRange.from.toISOString());
    if (dateRange?.to) params.set("to", dateRange.to.toISOString());
    return `/api/remittance?${params.toString()}`;
  }, [casinoGroup, dateRange]);

  const { data, error, isLoading, mutate } = useSWR<RemittanceForTable[]>(
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

  // 🔥 Real-time updates via Pusher
  usePusher<{
    remittanceId: string;
    action: "CREATED" | "APPROVED" | "REJECTED";
    timestamp: string;
  }>({
    channels: casinoGroup ? [pusherChannel.transactions(casinoGroup)] : [],
    eventName: "remittance-updated",
    onEvent: (payload) => {
      console.log("📢 Remittance updated:", payload);
      setLastUpdate(new Date(payload.timestamp));
      mutate();
    },
  });

  return {
    remittances: data ?? [],
    error,
    isLoading,
    lastUpdate,
    refetch: mutate,
  };
};

import useSWR from "swr";
import { useState, useMemo } from "react";
import { pusherChannel } from "@/lib/pusher";
import { usePusher } from "../../use-pusher";
import { DateRange } from "react-day-picker";
import { DpayTransaction } from "@prisma/client";

// Simple fetcher function
const fetcher = async (url: string) => {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch dpay transaction logs");
  return res.json();
};

export const useDPayTransactionLogs = (
  casinoGroup?: string,
  dateRange?: DateRange
) => {
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Memoized URL with filters
  const swrKey = useMemo(() => {
    const params = new URLSearchParams();
    if (casinoGroup) params.set("casinoGroup", casinoGroup);
    if (dateRange?.from) params.set("from", dateRange.from.toISOString());
    if (dateRange?.to) params.set("to", dateRange.to.toISOString());
    return `/api/dpay/payment/logs?${params.toString()}`;
  }, [casinoGroup, dateRange]);

  const { data, error, isLoading, mutate } = useSWR<DpayTransaction[]>(
    swrKey,
    fetcher,
    {
      refreshInterval: 0, // disable polling, rely on Pusher
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 3000,
      shouldRetryOnError: true,
    }
  );

  // 🔥 Real-time updates via Pusher
  usePusher<{
    cashinId: string;
    action: "COMPLETED" | "PENDING";
    timestamp: string;
  }>({
    channels: casinoGroup ? [pusherChannel.transactions(casinoGroup)] : [],
    eventName: "dpay-transaction-log-updated",
    onEvent: (payload) => {
      console.log("📢  DPAY Transaction Log Updated:", payload);
      setLastUpdate(new Date(payload.timestamp));
      mutate();
    },
  });

  return {
    transactionLogs: data ?? [],
    error,
    isLoading,
    lastUpdate,
    refetch: mutate,
  };
};

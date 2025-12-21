import useSWR from "swr";
import { useState } from "react";
import { pusherChannel } from "@/lib/pusher";
import { usePusher } from "../../use-pusher";
import { CashoutForTable } from "@/components/table/cashout/cashoutColumns";

// Simple fetcher function
const fetcher = async (url: string) => {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch cashouts");
  return res.json();
};

export const useCashouts = (casinoGroup?: string) => {
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  let url = "/api/cashout";
  if (casinoGroup) {
    url += `?casinoGroup=${encodeURIComponent(casinoGroup)}`;
  }

  const { data, error, isLoading, mutate } = useSWR<CashoutForTable[]>(
    url,
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
    cashoutId: string;
    action: "CREATED" | "APPROVED" | "REJECTED";
    timestamp: string;
  }>({
    channels: casinoGroup ? [pusherChannel.transactions(casinoGroup)] : [],
    eventName: "cashout-updated",
    onEvent: (payload) => {
      console.log("📢 Cashout updated:", payload);
      setLastUpdate(new Date(payload.timestamp));

      // Revalidate SWR cache
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

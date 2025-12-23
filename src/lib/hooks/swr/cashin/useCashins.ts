import useSWR from "swr";
import { useState } from "react";
import { pusherChannel } from "@/lib/pusher";
import { usePusher } from "../../use-pusher";
import { CashinForTable } from "@/components/table/cashin/cashinColumns";

// Simple fetcher function
const fetcher = async (url: string) => {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch cashins");
  return res.json();
};

export const useCashins = (casinoGroup?: string) => {
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  let url = "/api/cashin";
  if (casinoGroup) {
    url += `?casinoGroup=${encodeURIComponent(casinoGroup)}`;
  }

  const { data, error, isLoading, mutate } = useSWR<CashinForTable[]>(
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
    cashinId: string;
    action: "CREATED" | "APPROVED" | "REJECTED";
    timestamp: string;
  }>({
    channels: casinoGroup ? [pusherChannel.transactions(casinoGroup)] : [],
    eventName: "cashin-updated",
    onEvent: (payload) => {
      console.log("📢 Cashin updated:", payload);
      setLastUpdate(new Date(payload.timestamp));

      // Revalidate SWR cache
      mutate();
    },
  });

  return {
    cashins: data ?? [],
    error,
    isLoading,
    lastUpdate,
    refetch: mutate,
  };
};

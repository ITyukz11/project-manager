import useSWR from "swr";
import { useState } from "react";
import { pusherChannel } from "@/lib/pusher";
import { usePusher } from "../../use-pusher";
import { RemittanceForTable } from "@/components/table/remittance/remittanceColumns";

// Simple fetcher function
const fetcher = async (url: string) => {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch remittances");
  return res.json();
};

export const useRemittance = (casinoGroup?: string) => {
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  let url = "/api/remittance";
  if (casinoGroup) {
    url += `?casinoGroup=${encodeURIComponent(casinoGroup)}`;
  }

  const { data, error, isLoading, mutate } = useSWR<RemittanceForTable[]>(
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
    remittanceId: string;
    action: "CREATED" | "APPROVED" | "REJECTED";
    timestamp: string;
  }>({
    channels: casinoGroup ? [pusherChannel.transactions(casinoGroup)] : [],
    eventName: "remittance-updated",
    onEvent: (payload) => {
      console.log("📢 Remittance updated:", payload);
      setLastUpdate(new Date(payload.timestamp));

      // Revalidate SWR cache
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

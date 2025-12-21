import { CasinoGroup, TransactionRequest, User } from "@prisma/client";
import useSWR from "swr";
import { useState } from "react";
import { pusherChannel } from "@/lib/pusher";
import { usePusher } from "../../use-pusher";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
};

export const useTransactionRequest = (casinoGroup?: string) => {
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  let url = "/api/transaction-request";
  if (casinoGroup) {
    url += `?casinoGroup=${encodeURIComponent(casinoGroup)}`;
  }

  const { data, error, isLoading, mutate } = useSWR<
    (TransactionRequest & {
      processedBy: User;
      casinoGroup: CasinoGroup;
    })[]
  >(url, fetcher, {
    refreshInterval: 0, // ❌ disable polling
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 3000,
    shouldRetryOnError: true,
  });

  // 🔥 Real-time updates via Pusher
  usePusher<{
    transactionId: string;
    action: string;
    timestamp: string;
  }>({
    channels: casinoGroup ? [pusherChannel.transactions(casinoGroup)] : [],
    eventName: "transaction-updated",
    onEvent: (payload) => {
      console.log("📢 Transaction updated:", payload);
      setLastUpdate(new Date(payload.timestamp));

      // Revalidate SWR cache
      mutate();
    },
  });

  return {
    transactionRequests: data ?? [],
    error,
    isLoading,
    lastUpdate,
    refetch: mutate,
  };
};

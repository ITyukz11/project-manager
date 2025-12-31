import { CasinoGroup, TransactionRequest, User } from "@prisma/client";
import useSWR from "swr";
import { useMemo, useState } from "react";
import { pusherChannel } from "@/lib/pusher";
import { usePusher } from "../../use-pusher";
import { DateRange } from "react-day-picker";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
};

export const useTransactionRequest = (
  casinoGroup?: string,
  dateRange?: DateRange
) => {
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const swrKey = useMemo(() => {
    const params = new URLSearchParams();
    if (casinoGroup) params.set("casinoGroup", casinoGroup);
    if (dateRange?.from) params.set("from", dateRange.from.toISOString());
    if (dateRange?.to) params.set("to", dateRange.to.toISOString());
    return `/api/transaction-request?${params.toString()}`;
  }, [casinoGroup, dateRange]);

  const { data, error, isLoading, mutate } = useSWR<
    (TransactionRequest & {
      processedBy: User;
      casinoGroup: CasinoGroup;
    })[]
  >(swrKey, fetcher, {
    refreshInterval: 0, // ❌ disable polling
    revalidateOnFocus: false,
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

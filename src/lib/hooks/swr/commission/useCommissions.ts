import useSWR from "swr";
import { useState, useMemo } from "react";
import { pusherChannel } from "@/lib/pusher";
import { usePusher } from "../../use-pusher";
import { DateRange } from "react-day-picker";
import { CommissionForTable } from "@/components/table/commission/commissionColumns";

const fetcher = async (url: string) => {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch commissions");
  return res.json();
};

export const useCommissions = (casinoGroup?: string, dateRange?: DateRange) => {
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

    return `/api/commission?${params.toString()}`;
  }, [casinoGroup, dateRange]); // <-- depends on full dateRange now

  const { data, error, isLoading, mutate } = useSWR<CommissionForTable[]>(
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
    commissionId: string;
    action: "CREATED" | "APPROVED" | "REJECTED";
    timestamp: string;
  }>({
    channels: casinoGroup ? [pusherChannel.transactions(casinoGroup)] : [],
    eventName: "commission-updated",
    onEvent: (payload) => {
      console.log("📢 Commission updated:", payload);
      setLastUpdate(new Date(payload.timestamp));
      mutate();
    },
  });

  return {
    commissions: data ?? [],
    error,
    isLoading,
    lastUpdate,
    refetch: mutate,
  };
};

import useSWR from "swr";
import { useState, useMemo } from "react";
import { pusherChannel } from "@/lib/pusher";
import { usePusher } from "../../use-pusher";
import { DateRange } from "react-day-picker";
import { CustomerSupportForTable } from "@/components/table/customer-support/customerSupportColumn";

const fetcher = async (url: string) => {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch customerSupports");
  return res.json();
};

export const useCustomerSupports = (
  casinoGroup?: string,
  dateRange?: DateRange
) => {
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const swrKey = useMemo(() => {
    const params = new URLSearchParams();
    if (casinoGroup) params.set("casinoGroup", casinoGroup);
    if (dateRange?.from) params.set("from", dateRange.from.toISOString());
    if (dateRange?.to) params.set("to", dateRange.to.toISOString());
    return `/api/customer-support?${params.toString()}`;
  }, [casinoGroup, dateRange]);

  const { data, error, isLoading, mutate } = useSWR<CustomerSupportForTable[]>(
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
    customerSupportId: string;
    action: "CREATED" | "COMPLETED" | "REJECTED" | "UPDATED";
    timestamp: string;
  }>({
    channels: casinoGroup ? [pusherChannel.transactions(casinoGroup)] : [],
    eventName: "customerSupport-updated",
    onEvent: (payload) => {
      setLastUpdate(new Date(payload.timestamp));
      mutate();
    },
  });

  return {
    customerSupports: data ?? [],
    error,
    isLoading,
    lastUpdate,
    refetch: mutate,
  };
};

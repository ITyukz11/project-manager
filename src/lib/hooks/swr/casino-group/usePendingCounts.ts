import useSWR from "swr";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
};

export interface PendingCounts {
  cashin: number;
  cashout: number;
  remittance: number;
  concern: number;
  task: number;
  transaction: number;
  total: number;
}

export const usePendingCounts = (casinoGroup?: string) => {
  const url = casinoGroup
    ? `/api/casino-group/pending-counts?casinoGroup=${encodeURIComponent(
        casinoGroup
      )}`
    : null;

  const { data, error, isLoading, mutate } = useSWR<PendingCounts>(
    url,
    fetcher,
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: false, // Don't refetch on window focus
      dedupingInterval: 10000, // Dedupe requests within 10 seconds
    }
  );

  return {
    counts: data ?? {
      cashin: 0,
      cashout: 0,
      remittance: 0,
      concern: 0,
      task: 0,
      transaction: 0,
      total: 0,
    },
    error,
    isLoading,
    mutate,
  };
};

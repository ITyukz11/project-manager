import useSWR from "swr";

type OPayBalanceResponse = {
  status: number;
  current_balance: number;
  holding_balance: number;
  outstanding_balance: number;
  error_code: string | null;
  error_msg: string | null;
};

// POST fetcher
const postFetcher = async (url: string): Promise<OPayBalanceResponse> => {
  const res = await fetch(url, { method: "POST" });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || "Failed to fetch OptimumPay balance");
  }

  return res.json();
};

export function useOPayBalance() {
  const { data, error, isLoading, mutate, isValidating } = useSWR(
    "/api/optimum-pay/balance",
    postFetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      shouldRetryOnError: true,
      refreshInterval: 60000,
    },
  );

  return {
    oPayBalance: data,
    currentBalance: data?.current_balance ?? 0,
    holdingBalance: data?.holding_balance ?? 0,
    outstandingBalance: data?.outstanding_balance ?? 0,
    isSuccess: data?.status === 1,

    error,
    isLoading,
    isValidating,
    refetch: mutate,
  };
}

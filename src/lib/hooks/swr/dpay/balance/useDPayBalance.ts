import useSWR from "swr";

// Fetcher function with error handling
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    // You can throw a more descriptive error, or just the text
    const errorText = await res.text();
    throw new Error(errorText || "Failed to fetch cash-out merchants");
  }
  return res.json();
};

export function useDPayBalance() {
  const { data, error, isLoading, mutate, isValidating } = useSWR(
    "/api/droplet/payment/cashout-merchants",
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      shouldRetryOnError: true,
      refreshInterval: 60000, // Refresh every 60 seconds
    }
  );

  return {
    dpayBalance: data ?? [],
    error,
    isLoading,
    refetch: mutate,
    isValidating,
  };
}

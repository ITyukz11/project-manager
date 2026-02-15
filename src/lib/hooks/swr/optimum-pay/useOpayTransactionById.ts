import useSWR from "swr";

// Fetcher function for SWR
const fetcher = (url: string) => fetch(url).then((res) => res.json());

/**
 * Custom SWR hook to get all OpayTransaction records for a userId.
 * @param userId The user's ID
 * @returns { data, error, isLoading, mutate }
 */
export function useOpayTransactionById(userId?: string) {
  // Only run if userId is available
  const shouldFetch = !!userId;
  const { data, error, isLoading, mutate } = useSWR(
    shouldFetch
      ? `/api/optimum-pay/transactions?userId=${encodeURIComponent(userId!)}`
      : null,
    fetcher,
  );

  return {
    transactions: data, // Array of OpayTransaction | undefined
    error,
    isLoading,
    mutate,
  };
}

import useSWR from "swr";

// Simple fetcher that converts response to JSON
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
};

// Returns: { data, error, isLoading }
export const useCountCashinPending = (casinoGroup: string) => {
  const url = `/api/cashin/count-pending?casinoGroup=${encodeURIComponent(
    casinoGroup
  )}`;

  // Adjust API path as needed!
  const { data, error, isLoading, mutate } = useSWR(url, fetcher);

  // data will be an array of cashins
  return {
    pendingCashinCount: data?.count ?? 0,
    pendingCashinCountError: error,
    pendingCashinCountIsLoading: isLoading,
    pendingCashinCountMutate: mutate, // for refetching if you post a new cashin etc
  };
};

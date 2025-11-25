import useSWR from "swr";

// Simple fetcher that converts response to JSON
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
};

// Returns: { data, error, isLoading }
export const useCountCashoutPending = (casinoGroup: string) => {
  const url = `/api/cashout/count-pending?casinoGroup=${encodeURIComponent(
    casinoGroup
  )}`;

  // Adjust API path as needed!
  const { data, error, isLoading, mutate } = useSWR(url, fetcher);

  // data will be an array of cashouts
  return {
    count: data?.count ?? 0,
    error,
    isLoading,
    mutate, // for refetching if you post a new cashout etc
  };
};

import useSWR from "swr";

// Simple fetcher that converts response to JSON
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
};

// Returns: { data, error, isLoading }
export const useCashouts = (casinoGroup?: string) => {
  let url = "/api/cashout";
  if (casinoGroup) {
    url += `?casinoGroup=${encodeURIComponent(casinoGroup)}`;
  }
  // Adjust API path as needed!
  const { data, error, isLoading, mutate } = useSWR(url, fetcher);

  // data will be an array of cashouts
  return {
    cashouts: data ?? [],
    error,
    isLoading,
    mutate, // for refetching if you post a new cashout etc
  };
};

import useSWR from "swr";

// Simple fetcher that converts response to JSON
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
};

// Returns: { data, error, isLoading }
export const useCountRemittancePending = (casinoGroup: string) => {
  const url = `/api/remittance/count-pending?casinoGroup=${encodeURIComponent(
    casinoGroup
  )}`;

  // Adjust API path as needed!
  const { data, error, isLoading, mutate } = useSWR(url, fetcher);

  // data will be an array of remittances
  return {
    pendingRemittanceCount: data?.count ?? 0,
    pendingRemittanceCountError: error,
    pendingRemittanceCountIsLoading: isLoading,
    pendingRemittanceCountMutate: mutate, // for refetching if you post a new remittance etc
  };
};

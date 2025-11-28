import useSWR from "swr";

// Simple fetcher that converts response to JSON
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
};

// Returns: { data, error, isLoading }
export const useCountTaskPending = (casinoGroup: string) => {
  const url = `/api/task/count-pending?casinoGroup=${encodeURIComponent(
    casinoGroup
  )}`;

  // Adjust API path as needed!
  const { data, error, isLoading, mutate } = useSWR(url, fetcher);

  // data will be an array of tasks
  return {
    pendingTaskCount: data?.count ?? 0,
    pendingTaskCountError: error,
    pendingTaskCountIsLoading: isLoading,
    pendingTaskCountMutate: mutate, // for refetching if you post a new task etc
  };
};

import useSWR from "swr";

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) {
      throw new Error("Failed to fetch pending status");
    }
    return res.json();
  });

export function useTransactionRequestPending(externalUserId?: string) {
  const shouldFetch = Boolean(externalUserId);

  const { data, error, isLoading, mutate } = useSWR(
    shouldFetch ? `/api/transaction-request/${externalUserId}/pending` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 10_000,
    },
  );

  return {
    hasPending: data?.hasPending ?? false,
    isLoading,
    isError: !!error,
    mutate,
  };
}

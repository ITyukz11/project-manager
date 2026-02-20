import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useCommissionByUserName(
  userName?: string | null,
  enabled: boolean = true,
) {
  const key =
    enabled && userName
      ? `/api/commission/by-username?userName=${userName}`
      : null;

  const { data, error, isLoading, mutate } = useSWR(key, fetcher);

  return {
    commissions: data ?? [],
    isLoading,
    isError: error,
    mutate,
  };
}

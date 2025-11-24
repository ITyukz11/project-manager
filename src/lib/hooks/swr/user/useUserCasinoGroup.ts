import useSWR from "swr";

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch casino groups");
  return response.json();
};

/**
 * Fetches user's casino groups by ID
 * @param userId string
 */
export function useUserCasinoGroups(userId?: string) {
  const { data, error, mutate } = useSWR(
    userId ? `/api/user/${userId}/casino-group` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      shouldRetryOnError: false,
      dedupingInterval: 60 * 1000,
    }
  );

  return {
    casinoGroups: data ?? [],
    casinoGroupsLoading: !error && !data,
    casinoGroupsError: error,
    refetchCasinoGroups: mutate,
  };
}

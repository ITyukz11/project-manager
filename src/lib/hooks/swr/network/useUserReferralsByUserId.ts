import useSWR from "swr";

// Default fetcher for JSON
const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useUserReferralsByUserId(
  userId: string | undefined,
  casinoGroup: string | undefined
) {
  const shouldFetch = typeof userId === "string" && !!userId;
  const { data, error, isLoading, mutate } = useSWR(
    shouldFetch
      ? `/api/network/users/${userId}/referral?casinoGroup=${casinoGroup}`
      : null,
    fetcher
  );

  return {
    referrals: data,
    isLoading,
    error,
    mutate,
  };
}

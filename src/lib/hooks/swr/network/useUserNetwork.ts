import { User } from "@prisma/client";
import useSWR from "swr";

// Add optional casinoGroup parameter of type string
const fetchUsersNetwork = async ([url, method]: [string, string]) => {
  const response = await fetch(url, { method });
  if (!response.ok) throw new Error("Failed to fetch");
  return response.json();
};

/**
 * Fetches users network, optionally filtered by casinoGroup ID.
 * @param casinoGroupId Optional casino group id as string to filter users.
 */
export const useUsersNetwork = (casinoGroupId?: string) => {
  // Conditionally build the API endpoint
  const url = casinoGroupId
    ? `/api/network/users?casinoGroup=${casinoGroupId}`
    : "/api/network/users";

  const { data, error, mutate } = useSWR<
    (User & { _count?: { groupChats?: number } })[]
  >([url, "GET"], fetchUsersNetwork, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    refreshInterval: 0,
    dedupingInterval: 60 * 1000,
  });

  return {
    usersDataNetwork: data ?? [],
    usersLoadingNetwork: !error && !data,
    usersErrorNetwork: error,
    refetchUsersNetwork: mutate,
  };
};

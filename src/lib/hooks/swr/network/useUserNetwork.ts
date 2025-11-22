import { NetworkUser } from "@prisma/client";
import useSWR from "swr";

// useSWR key can be an array: [url, "POST"]
const fetchUsersNetwork = async ([url, method]: [string, string]) => {
  const response = await fetch(url, { method });
  if (!response.ok) throw new Error("Failed to fetch");
  return response.json();
};

export const useUsersNetwork = () => {
  const { data, error, mutate } = useSWR<
    (NetworkUser & { _count?: { groupChats?: number } })[]
  >(["/api/network/users", "GET"], fetchUsersNetwork, {
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

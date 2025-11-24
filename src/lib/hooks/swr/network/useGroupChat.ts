import { GroupChat, User } from "@prisma/client";
import useSWR from "swr";

const fetchUsersNetwork = async ([url, method]: [string, string]) => {
  const response = await fetch(url, { method });
  if (!response.ok) throw new Error("Failed to fetch");
  return response.json();
};

/**
 * SWR hook for group chats.
 * Optionally pass casinoGroup (string) to filter group chats by casino group.
 *
 * @param casinoGroup Optional casino group name/string
 */
export const useGroupChats = (casinoGroup?: string) => {
  let url = "/api/network/group-chats";
  if (casinoGroup) {
    url += `?casinoGroup=${encodeURIComponent(casinoGroup)}`;
  }

  const { data, error, mutate } = useSWR<
    (GroupChat & { users: User[]; _count?: { users?: number } })[]
  >([url, "GET"], fetchUsersNetwork, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    refreshInterval: 0,
    dedupingInterval: 60 * 1000,
  });

  return {
    groupChatsData: data ?? [],
    groupChatsLoading: !error && !data,
    groupChatsError: error,
    refetchGroupChats: mutate,
  };
};

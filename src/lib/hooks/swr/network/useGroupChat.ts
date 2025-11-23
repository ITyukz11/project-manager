import { GroupChat, User } from "@prisma/client";
import useSWR from "swr";

const fetchUsersNetwork = async ([url, method]: [string, string]) => {
  const response = await fetch(url, { method });
  if (!response.ok) throw new Error("Failed to fetch");
  return response.json();
};

export const useGroupChats = () => {
  const { data, error, mutate } = useSWR<
    (GroupChat & { users: User[]; _count?: { users?: number } })[]
  >(["/api/network/group-chats", "GET"], fetchUsersNetwork, {
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

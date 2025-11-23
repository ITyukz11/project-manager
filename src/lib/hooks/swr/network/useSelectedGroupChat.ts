import { GroupChat, User } from "@prisma/client";
import useSWR from "swr";

// useSWR key can be an array: [url, method]
const fetchUsersNetwork = async ([url, method]: [string, string]) => {
  const response = await fetch(url, { method });
  if (!response.ok) throw new Error("Failed to fetch");
  return response.json();
};

/**
 * Hook to fetch all group chats or a specific one by ID
 */
export const useSelectedGroupChat = (username: string) => {
  // If username is provided, use API for single group chat, otherwise fetch all
  const apiUrl = `/api/network/group-chats/${username}`; // fetch one

  //GroupChat & NetworkUser & { _count?: { users?: number } }>[]
  const { data, error, mutate } = useSWR<
    GroupChat & Pick<User, "id"> & { _count?: { users?: number } } // union for multi/single result
  >([apiUrl, "GET"], fetchUsersNetwork, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    refreshInterval: 0,
    dedupingInterval: 60 * 1000,
  });

  // Normalize the data: always return an array
  const groupChatsData =
    username && data && !Array.isArray(data) ? [data] : data ?? [];

  return {
    selectedGroupChatsData: groupChatsData,
    selectedGroupChatsLoading: !error && !data,
    selectedGroupChatsError: error,
    refetchGroupChats: mutate,
  };
};

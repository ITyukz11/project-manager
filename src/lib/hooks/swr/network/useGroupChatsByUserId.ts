import useSWR from "swr";

// Default fetcher for JSON
const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useGroupChatsByUserId(userId: string | undefined) {
  const shouldFetch = typeof userId === "string" && !!userId;
  const { data, error, isLoading, mutate } = useSWR(
    shouldFetch ? `/api/network/users/${userId}/group-chats` : null,
    fetcher
  );

  return {
    groupChats: data,
    isLoading,
    error,
    mutate,
  };
}

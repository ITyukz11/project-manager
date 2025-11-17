"use client";

import { User } from "@prisma/client";
import useSWR from "swr";

const fetchGroupChat = async (url: string) => {
  try {
    const response = await fetch(url, { method: "GET" });

    if (!response.ok) {
      throw new Error("Failed to fetch");
    }

    const data: User[] = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching group chats:", error);
    throw error;
  }
};

export const useGroupChats = () => {
  const { data, error, mutate } = useSWR<User[]>(
    `/api/groupchat`,
    fetchGroupChat,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      refreshInterval: 0,
      dedupingInterval: 60 * 1000,
    }
  );

  return {
    groupChatsData: data,
    groupChatsLoading: !error && !data,
    groupChatsError: error,
    refetchGroupChats: mutate,
  };
};

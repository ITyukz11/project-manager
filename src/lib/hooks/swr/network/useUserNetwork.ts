"use client";

import { User } from "@prisma/client";
import useSWR from "swr";

const fetchUsersNetwork = async (url: string) => {
  try {
    const response = await fetch(url, { method: "GET" });

    if (!response.ok) {
      throw new Error("Failed to fetch");
    }

    const data: User[] = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching users network:", error);
    throw error;
  }
};

export const useUsersNetwork = () => {
  const { data, error, mutate } = useSWR<User[]>(
    `/api/user-network`,
    fetchUsersNetwork,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      refreshInterval: 0,
      dedupingInterval: 60 * 1000,
    }
  );

  return {
    usersDataNetwork: data,
    usersLoadingNetwork: !error && !data,
    usersErrorNetwork: error,
    refetchUsersNetwork: mutate,
  };
};

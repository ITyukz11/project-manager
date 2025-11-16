"use client";

import { User } from "@prisma/client";
import useSWR from "swr";

const fetchUsers = async (url: string) => {
  try {
    const response = await fetch(url, { method: "GET" });

    if (!response.ok) {
      throw new Error("Failed to fetch");
    }

    const data: User[] = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
};

export const useUsers = () => {
  const { data, error, mutate } = useSWR<User[]>(`/api/user`, fetchUsers, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    refreshInterval: 0,
    dedupingInterval: 60 * 1000,
  });

  return {
    usersData: data,
    usersLoading: !error && !data,
    usersError: error,
    refetchUsers: mutate,
  };
};

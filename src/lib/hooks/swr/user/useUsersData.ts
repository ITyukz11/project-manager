"use client";

import { User } from "@prisma/client";
import useSWR from "swr";

// Helper for fetch
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

// casinoGroup is now optional!
export const useUsers = (casinoGroup?: string) => {
  // Build URL based on parameter
  const apiUrl = casinoGroup
    ? `/api/user?casinoGroup=${casinoGroup}`
    : `/api/user`;

  const { data, error, mutate } = useSWR<User[]>(apiUrl, fetchUsers, {
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

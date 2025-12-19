"use client";

import { User } from "@prisma/client";
import useSWR from "swr";

// Type definition matching your columns
export type UserWithCasinoGroups = User & {
  casinoGroups?: { id: string; name: string }[];
};

// Helper for fetch
const fetchUsers = async (url: string): Promise<UserWithCasinoGroups[]> => {
  try {
    const response = await fetch(url, { method: "GET" });
    if (!response.ok) {
      throw new Error("Failed to fetch users");
    }
    const data: UserWithCasinoGroups[] = await response.json();
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
    ? `/api/user?casinoGroup=${encodeURIComponent(casinoGroup)}`
    : `/api/user`;

  const { data, error, isLoading, mutate } = useSWR<UserWithCasinoGroups[]>(
    apiUrl,
    fetchUsers,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      refreshInterval: 0,
      dedupingInterval: 60 * 1000,
    }
  );

  return {
    usersData: data,
    usersLoading: isLoading,
    usersError: error,
    refetchUsers: mutate,
  };
};

import useSWR from "swr";
import { useState } from "react";
import { OnlineUser } from "@/components/table/users/currently-online/current-online-columns";
import { pusherChannel } from "@/lib/pusher";
import { usePusher } from "../../use-pusher";

/**
 * Response type from the API endpoint
 */
type OnlineUsersResponse = {
  count: number;
  users: OnlineUser[];
};

/**
 * Fetcher function for online users
 */
const fetchOnlineUsers = async (url: string) => {
  const res = await fetch(url, {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      body?.error || `Failed to fetch online users (status ${res.status})`
    );
  }

  const data = (await res.json()) as OnlineUsersResponse;
  return data;
};

/**
 * Hook to fetch and manage online users data with real-time Pusher updates
 */
export const useOnlineUsers = () => {
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const { data, error, isLoading, mutate } = useSWR<OnlineUsersResponse>(
    "/api/user/current-online",
    fetchOnlineUsers,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 0,
      dedupingInterval: 2000,
      shouldRetryOnError: true,
      errorRetryCount: 3,
      errorRetryInterval: 5000,
    }
  );

  // Handle Pusher events - online users updates
  usePusher<{ timestamp: string }>({
    channels: [pusherChannel.onlineUsers()],
    eventName: "online-users-updated",
    onEvent: (data) => {
      console.log("📢 Online users updated:", data);
      setLastUpdate(new Date(data.timestamp));

      // Optional: Show toast notification
      // toast.info("Online users updated");

      mutate(); // Refresh the data
    },
  });

  return {
    onlineUsers: data?.users ?? [],
    onlineUsersCount: data?.count ?? 0,
    isLoading,
    error,
    lastUpdate,
    refetch: mutate,
  };
};

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
export const useOnlineUsers = (enabled: boolean) => {
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const { data, error, isLoading, mutate } = useSWR<OnlineUsersResponse>(
    enabled ? "/api/user/current-online" : null,
    fetchOnlineUsers,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 0,
      dedupingInterval: 2000,
      shouldRetryOnError: false,
    }
  );

  // Only subscribe to Pusher if enabled (admin)
  usePusher<{ timestamp: string }>({
    channels: enabled ? [pusherChannel.onlineUsers()] : [],
    eventName: "online-users-updated",
    onEvent: (data) => {
      setLastUpdate(new Date(data.timestamp));
      mutate();
    },
  });

  return {
    onlineUsers: enabled ? data?.users ?? [] : [],
    onlineUsersCount: enabled ? data?.count ?? 0 : 0,
    isLoading: enabled ? isLoading : false,
    error,
    lastUpdate,
    refetch: mutate,
  };
};

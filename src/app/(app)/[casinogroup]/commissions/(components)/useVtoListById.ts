"use client";

import useSWR from "swr";
import { Vto } from "./vto-columns";
import React from "react";

export type ParentChainItem = {
  id: string;
  userName: string | null;
  role: string;
};

export type VtoWithParentChain = Vto & {
  parentChain: ParentChainItem[];
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

/**
 * SWR hook to fetch VTOs for a specific user.
 * @param userName string | null
 * @param enabled boolean — whether to enable fetching (e.g. dialog is open and userId exists)
 * @returns { vtos, isLoading, isError, mutate }
 */
export function useVtoListById(
  userName: string | null,
  enabled: boolean = true,
  unclaimed: boolean = true,
) {
  const [userId, setUserId] = React.useState<string | null>(null);

  // Fetch the userId from userName
  React.useEffect(() => {
    if (!userName) return;

    let isMounted = true;

    const fetchUserId = async () => {
      try {
        const res = await fetch(
          `/api/commission/get-userid?userName=${userName}`,
        );

        const data = await res.json(); // assuming the GET returns { id: "..." }
        if (isMounted && data?.id) setUserId(data.id);
      } catch (err) {
        console.error("Failed to fetch userId:", err);
      }
    };

    fetchUserId();

    return () => {
      isMounted = false;
    };
  }, [userName]);

  const { data, error, isLoading, mutate } = useSWR<VtoWithParentChain[]>(
    userId
      ? `/api/commission/vto?userId=${userId}&unclaimed=${unclaimed}`
      : null,
    fetcher,
  );

  return {
    vtos: data || [],
    isLoading,
    isError: !!error,
    mutate,
  };
}

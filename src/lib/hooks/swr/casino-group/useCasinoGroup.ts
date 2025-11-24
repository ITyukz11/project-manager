import { CasinoGroup, GroupChat, User } from "@prisma/client";
import useSWR from "swr";

export type CasinoGroupWithCounts = CasinoGroup & {
  _count: {
    users: number;
    groupChats: number;
  };
  users: User[];
  groupChats: GroupChat[];
};

const fetchCasinoGroupNetwork = async ([url, method]: [string, string]) => {
  const response = await fetch(url, { method });
  if (!response.ok) throw new Error("Failed to fetch");
  return response.json();
};

/**
 * SWR hook for casino groups. Optionally pass a casinoId for a specific group.
 */
export const useCasinoGroup = (casinoId?: string) => {
  const url = casinoId
    ? `/api/casino-group?casinoId=${casinoId}` // Will call single group endpoint
    : "/api/casino-group";

  const { data, error, mutate } = useSWR<CasinoGroupWithCounts[]>(
    [url, "GET"],
    fetchCasinoGroupNetwork,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      refreshInterval: 0,
      dedupingInterval: 60 * 1000,
    }
  );

  return {
    casinoGroupData: data ?? [],
    casinoGroupLoading: !error && !data,
    casinoGroupError: error,
    refetchCasinoGroup: mutate,
  };
};

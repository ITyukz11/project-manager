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
 * SWR hook for casino groups.
 * @param casinoId optional casino group id
 * @param enabled controls whether the request should run
 */
export const useCasinoGroup = (casinoId?: string, enabled: boolean = true) => {
  const url = casinoId
    ? `/api/casino-group?casinoId=${casinoId}`
    : "/api/casino-group";

  const { data, error, mutate } = useSWR<CasinoGroupWithCounts[]>(
    enabled ? [url, "GET"] : null, // ✅ conditional fetch
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
    casinoGroupLoading: enabled && !error && !data,
    casinoGroupError: error,
    refetchCasinoGroup: mutate,
  };
};

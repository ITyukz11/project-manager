import { CasinoGroup } from "@prisma/client";
import useSWR from "swr";

const fetchCasinoGroupNetwork = async ([url, method]: [string, string]) => {
  const response = await fetch(url, { method });
  if (!response.ok) throw new Error("Failed to fetch");
  return response.json();
};

/**
 * SWR hook for casino group within the network context.
 * Requires a casinoName to filter.
 *
 * @param casinoName Required casino group name (string)
 */
export const useCasinoGroupNetwork = (casinoName: string) => {
  if (!casinoName) {
    throw new Error("casinoName is required in useCasinoGroupNetwork");
  }
  // Use dynamic route endpoint for case-insensitive name matching
  const url = `/api/network/casino-group/${encodeURIComponent(casinoName)}`;

  const { data, error, mutate } = useSWR<CasinoGroup>(
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
    casinoGroupNetworkData: data ?? null,
    casinoGroupNetworkLoading: !error && !data,
    casinoGroupNetworkError: error,
    refetchCasinoGroupNetwork: mutate,
  };
};

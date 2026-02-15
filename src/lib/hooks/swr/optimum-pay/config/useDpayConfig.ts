import { DpayConfig } from "@prisma/client";
import useSWR from "swr";

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  });

export function useDpayConfig(casinoGroup: string) {
  const { data, error, isLoading, mutate } = useSWR<DpayConfig>(
    `/api/dpay/config?casinoGroupName=${encodeURIComponent(casinoGroup)}`,
    fetcher,
  );

  return {
    config: data,
    isLoading,
    isError: !!error,
    mutate,
  };
}

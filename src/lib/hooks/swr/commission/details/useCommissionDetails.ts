import { fetcher } from "@/lib/fetcher";
import { Commission } from "@prisma/client";
import useSWR from "swr";

export function useCommissionDetailsById(commissionId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<Commission>(
    commissionId ? `/api/commission/${commissionId}/details` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      shouldRetryOnError: false,
    },
  );

  return {
    commission: data,
    isLoading,
    error: error?.message || null,
    mutate,
  };
}

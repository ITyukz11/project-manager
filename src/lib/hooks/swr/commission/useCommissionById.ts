import {
  Attachment,
  Commission,
  CommissionLogs,
  CommissionThread,
  User,
} from "@prisma/client";
import useSWR from "swr";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch commission");
  return res.json();
};

/**
 * Usage: const { commission, error, isLoading } = useCommissionById(id)
 */
export function useCommissionById(id: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR<
    Commission & {
      commissionLogs: (CommissionLogs & { performedBy: User })[];
    } & {
      user: User;
    } & {
      attachments: Attachment[];
    } & {
      commissionThreads: (CommissionThread & {
        author: User;
        attachments: Attachment[];
      })[];
    }
  >(id ? `/api/commission/${id}` : null, fetcher);

  return {
    commission: data,
    error,
    isLoading,
    mutate,
  };
}

import {
  Remittance,
  RemittanceAttachment,
  RemittanceLogs,
  RemittanceThread,
  User,
} from "@prisma/client";
import useSWR from "swr";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch cashout");
  return res.json();
};

/**
 * Usage: const { concern, error, isLoading } = useConcernById(id)
 */
export function useRemittanceById(id: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR<
    Remittance & {
      remittanceLogs: (RemittanceLogs & { performedBy: User })[];
    } & {
      user: User;
    } & {
      attachments: RemittanceAttachment[];
    } & {
      remittanceThreads: (RemittanceThread & {
        author: User;
        attachments: RemittanceAttachment[];
      })[];
    }
  >(id ? `/api/remittance/${id}` : null, fetcher);

  return {
    remittance: data,
    error,
    isLoading,
    mutate,
  };
}

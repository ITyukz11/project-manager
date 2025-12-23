import {
  Attachment,
  Cashin,
  CashinLogs,
  CashinThread,
  User,
} from "@prisma/client";
import useSWR from "swr";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch cashin");
  return res.json();
};

/**
 * Usage: const { cashout, error, isLoading } = useCashoutById(id)
 */
export function useCashinById(id: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR<
    Cashin & { cashinLogs: (CashinLogs & { performedBy: User })[] } & {
      user: User;
    } & {
      attachments: Attachment[];
    } & {
      cashinThreads: (CashinThread & {
        author: User;
        attachments: Attachment[];
      })[];
    }
  >(id ? `/api/cashin/${id}` : null, fetcher);

  return {
    cashin: data,
    error,
    isLoading,
    mutate,
  };
}

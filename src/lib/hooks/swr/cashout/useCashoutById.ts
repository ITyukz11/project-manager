import { Attachment, Cashout, CashoutThread, User } from "@prisma/client";
import useSWR from "swr";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch cashout");
  return res.json();
};

/**
 * Usage: const { cashout, error, isLoading } = useCashoutById(id)
 */
export function useCashoutById(id: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR<
    Cashout & { user: User } & { attachments: Attachment[] } & {
      cashoutThreads: (CashoutThread & { author: User })[];
    }
  >(id ? `/api/cashout/${id}` : null, fetcher);

  return {
    cashout: data,
    error,
    isLoading,
    mutate,
  };
}

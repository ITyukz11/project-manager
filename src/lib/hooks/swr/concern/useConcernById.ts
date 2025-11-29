import {
  Concern,
  ConcernAttachment,
  ConcernLogs,
  ConcernThread,
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
export function useConcernById(id: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR<
    Concern & { concernLogs: (ConcernLogs & { performedBy: User })[] } & {
      user: User;
    } & {
      attachments: ConcernAttachment[];
    } & {
      tagUsers: User[];
    } & {
      concernThreads: (ConcernThread & {
        author: User;
        attachments: ConcernAttachment[];
      })[];
    }
  >(id ? `/api/concern/${id}` : null, fetcher);

  return {
    concern: data,
    error,
    isLoading,
    mutate,
  };
}

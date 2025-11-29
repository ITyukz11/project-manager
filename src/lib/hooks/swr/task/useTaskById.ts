import {
  Task,
  TaskAttachment,
  TaskLogs,
  TaskThread,
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
export function useTaskById(id: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR<
    Task & {
      taskLogs: (TaskLogs & { performedBy: User })[];
    } & {
      user: User;
    } & {
      attachments: TaskAttachment[];
    } & {
      tagUsers: User[];
    } & {
      taskThreads: (TaskThread & {
        author: User;
        attachments: TaskAttachment[];
      })[];
    }
  >(id ? `/api/task/${id}` : null, fetcher);

  return {
    task: data,
    error,
    isLoading,
    mutate,
  };
}

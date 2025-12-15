"use client";

import { Role } from "@prisma/client";
import useSWR from "swr";

export type ReadyCheckParticipant = {
  id: string;
  userId: string;
  wasClockedIn: boolean;
  responded: boolean;
  respondedAt?: string | null;
  username?: string | null;
  role?: Role | null;
  createdAt: string;
};

export type ReadyCheck = {
  id: string;
  initiator: {
    id: string;
    name?: string | null;
    username?: string | null;
    role?: Role | null;
  };
  context?: string | null;
  startedAt: string;
  endedAt?: string | null;
  totalParticipants: number;
  totalClockedIn: number;
  participants?: ReadyCheckParticipant[];
  createdAt: string;
  updatedAt: string;
};

type ListResponse = {
  data: ReadyCheck[];
  meta: { total: number; page: number; limit: number };
};

const fetcher = async ([url, method]: readonly [string, string]) => {
  const res = await fetch(url, { method });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      body?.error || `Failed to fetch ready-checks (status ${res.status})`
    );
  }
  return res.json() as Promise<ListResponse>;
};

/**
 * SWR hook to fetch ready-checks list.
 *
 * Parameters:
 * - page (1-based)
 * - limit
 * - includeParticipants (default true)
 * - opts: optional SWR options: refreshInterval (ms), dedupingInterval (ms)
 *
 * Returns:
 * - readyChecks: ReadyCheck[]
 * - meta: { total, page, limit }
 * - loading, error
 * - mutate: SWR mutate
 * - isValidating
 */
export const useReadyChecks = (
  page = 1,
  limit = 50,
  includeParticipants = true,
  opts?: {
    refreshInterval?: number | false;
    dedupingInterval?: number;
    revalidateOnFocus?: boolean;
  }
) => {
  const qi = `?page=${encodeURIComponent(page)}&limit=${encodeURIComponent(
    limit
  )}&includeParticipants=${includeParticipants ? "true" : "false"}`;
  const url = `/api/ready-check${qi}`;

  const { data, error, mutate, isValidating } = useSWR<ListResponse>(
    [url, "GET"],
    fetcher,
    {
      revalidateOnFocus: opts?.revalidateOnFocus ?? true,
      refreshInterval:
        opts?.refreshInterval === false
          ? undefined
          : opts?.refreshInterval ?? 5000,
      dedupingInterval:
        typeof opts?.dedupingInterval === "number" ? opts.dedupingInterval : 0,
    }
  );

  return {
    readyChecks: data?.data ?? [],
    meta: data?.meta ?? { total: 0, page, limit },
    loading: !error && !data,
    error,
    mutate,
    isValidating,
  };
};

export default useReadyChecks;

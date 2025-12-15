"use client";

import useSWR from "swr";
import { Role } from "@prisma/client";

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

const fetcher = async (url: string) => {
  const res = await fetch(url, { method: "GET" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error || `Failed to fetch (status ${res.status})`);
  }
  return res.json();
};

type CommonOpts = {
  refreshInterval?: number | false;
  dedupingInterval?: number;
  revalidateOnFocus?: boolean;
};

/**
 * useReadyChecks
 *
 * Supports two call styles:
 * 1) Positional (legacy):
 *    useReadyChecks(page = 1, limit = 50, includeParticipants = true, readyCheckId = null, opts?)
 *
 * 2) Options object:
 *    useReadyChecks({ page?, limit?, includeParticipants?, readyCheckId?, opts? })
 *
 * Always returns a consistent shape:
 * {
 *   readyChecks: ReadyCheck[]; // an array (single item array when readyCheckId is provided)
 *   meta: { total, page, limit };
 *   loading, error, mutate, isValidating
 * }
 *
 * When readyCheckId is provided the hook fetches /api/ready-check/:id?includeParticipants=...
 * and returns readyChecks = data ? [data] : []
 */
export const useReadyChecks = (
  arg1?:
    | number
    | null
    | {
        page?: number;
        limit?: number;
        includeParticipants?: boolean;
        readyCheckId?: string | null;
        opts?: CommonOpts;
      },
  arg2 = 1,
  arg3 = 50,
  arg4 = true,
  arg5: string | null = null,
  arg6?: CommonOpts
) => {
  // Normalize arguments (support both positional and object style)
  let page: number;
  let limit: number;
  let includeParticipants: boolean;
  let readyCheckId: string | null;
  let opts: CommonOpts | undefined;

  if (typeof arg1 === "object" && arg1 !== null && !Array.isArray(arg1)) {
    // object-style call
    page = arg1.page ?? 1;
    limit = arg1.limit ?? 50;
    includeParticipants = arg1.includeParticipants ?? true;
    readyCheckId = arg1.readyCheckId ?? null;
    opts = arg1.opts;
  } else {
    // positional-style call
    page = (typeof arg1 === "number" ? arg1 : arg2) ?? 1;
    limit = arg3 ?? 50;
    includeParticipants = arg4 ?? true;
    readyCheckId = arg5 ?? null;
    opts = arg6;
  }

  const includeQ = `includeParticipants=${
    includeParticipants ? "true" : "false"
  }`;

  // Build URL depending on whether a single id is requested
  const url = readyCheckId
    ? `/api/ready-check/${encodeURIComponent(readyCheckId)}?${includeQ}`
    : `/api/ready-check?page=${encodeURIComponent(
        page
      )}&limit=${encodeURIComponent(limit)}&${includeQ}`;

  const { data, error, mutate, isValidating } = useSWR<any>(url, fetcher, {
    revalidateOnFocus: opts?.revalidateOnFocus ?? true,
    refreshInterval:
      opts?.refreshInterval === false
        ? undefined
        : opts?.refreshInterval ?? 5000,
    dedupingInterval:
      typeof opts?.dedupingInterval === "number" ? opts.dedupingInterval : 0,
  });

  // Normalize return shape: always provide readyChecks array and meta
  if (readyCheckId) {
    const single = (data as ReadyCheck) ?? null;
    return {
      readyChecks: single ? [single] : [],
      meta: { total: single ? 1 : 0, page, limit },
      loading: !error && !data,
      error,
      mutate,
      isValidating,
    } as {
      readyChecks: ReadyCheck[];
      meta: { total: number; page: number; limit: number };
      loading: boolean;
      error: any;
      mutate: typeof mutate;
      isValidating: boolean;
    };
  }

  const listData = data as ListResponse | undefined;
  return {
    readyChecks: listData?.data ?? [],
    meta: listData?.meta ?? { total: 0, page, limit },
    loading: !error && !data,
    error,
    mutate,
    isValidating,
  } as {
    readyChecks: ReadyCheck[];
    meta: { total: number; page: number; limit: number };
    loading: boolean;
    error: any;
    mutate: typeof mutate;
    isValidating: boolean;
  };
};

export default useReadyChecks;

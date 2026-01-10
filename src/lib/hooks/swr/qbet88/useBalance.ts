// hooks/useBalance.ts
"use client";

import { fetchQBetBalance } from "@/lib/qbet88/fetchBalance";
import useSWR from "swr";

export function useBalance(member_account?: string) {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    member_account ? ["qbet-balance", member_account] : null,
    () => fetchQBetBalance(member_account!),
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
      refreshInterval: 30000, // auto-refresh every 30s
    }
  );

  return {
    balance: data ?? "0.00",
    isLoading,
    isValidating,
    error,
    refreshBalance: mutate, // 👈 call this after BET/WIN
  };
}

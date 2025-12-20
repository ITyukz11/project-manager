import { CasinoGroup, TransactionRequest, User } from "@prisma/client";
import useSWR from "swr";

// Simple fetcher that converts response to JSON
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
};

// Returns: { data, error, isLoading }
export const useTransactionRequest = (casinoGroup?: string) => {
  let url = "/api/transaction-request";
  if (casinoGroup) {
    url += `?casinoGroup=${encodeURIComponent(casinoGroup)}`;
  }

  // Add auto-refresh configuration
  const { data, error, isLoading, mutate } = useSWR<
    (TransactionRequest & { processedBy: User; casinoGroup: CasinoGroup })[]
  >(url, fetcher, {
    refreshInterval: 10000, // Auto-refresh every 10 seconds (10000ms)
    revalidateOnFocus: true, // Revalidate when window regains focus
    revalidateOnReconnect: true, // Revalidate when browser regains network connection
    dedupingInterval: 2000, // Dedupe requests within 2 seconds
  });

  // data will be an array of transaction requests
  return {
    transactionRequests: data ?? [],
    error,
    isLoading,
    mutate, // for refetching if you post a new transaction request etc
  };
};

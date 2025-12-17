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
  // Adjust API path as needed!
  const { data, error, isLoading, mutate } = useSWR<
    (TransactionRequest & { processedBy: User; casinoGroup: CasinoGroup })[]
  >(url, fetcher);

  // data will be an array of concerns
  return {
    transactionRequests: data ?? [],
    error,
    isLoading,
    mutate, // for refetching if you post a new concern etc
  };
};

import useSWR from "swr";

interface TransactionDetails {
  id: string;
  type: string;
  username: string;
  referrer: string | null;
  externalUserId: string | null;
  amount: number;
  bankDetails: string | null;
  bankName: string | null;
  accountName: string | null;
  accountNumber: string | null;
  paymentMethod: string | null;
  status: string;
  remarks: string | null;
  receiptUrl: string | null;
  receiptHash: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  processedById: string | null;
  processedBy: {
    id: string;
    name: string;
    username: string;
    email: string;
  } | null;
  processedAt: string | null;
  casinoGroup: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface TransactionDetailsResponse {
  error: string;
  success: boolean;
  transaction: TransactionDetails;
}

const fetcher = async (url: string): Promise<TransactionDetails> => {
  const response = await fetch(url);
  const data: TransactionDetailsResponse = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to fetch transaction details");
  }

  return data.transaction;
};

export function useTransactionDetails(transactionId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<TransactionDetails>(
    transactionId ? `/api/transaction-request/details/${transactionId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      shouldRetryOnError: false,
    },
  );

  return {
    transaction: data,
    isLoading,
    error: error?.message || null,
    mutate,
  };
}

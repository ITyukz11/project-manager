import {
  CustomerSupport,
  CustomerSupportAttachment,
  CustomerSupportLogs,
  CustomerSupportThread,
  User,
} from "@prisma/client";
import useSWR from "swr";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch cashout");
  return res.json();
};

/**
 * Usage: const { customerSupport, error, isLoading } = useCustomerSupportById(id)
 */
export function useCustomerSupportById(id: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR<
    CustomerSupport & {
      customerSupportLogs: (CustomerSupportLogs & { performedBy: User })[];
    } & {
      user: User;
    } & {
      attachments: CustomerSupportAttachment[];
    } & {
      tagUsers: User[];
    } & {
      customerSupportThreads: (CustomerSupportThread & {
        author: User;
        attachments: CustomerSupportAttachment[];
      })[];
    }
  >(id ? `/api/customer-support/${id}` : null, fetcher);

  return {
    customerSupport: data,
    error,
    isLoading,
    mutate,
  };
}

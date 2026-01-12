import useSWR from "swr";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch user by id");
  return res.json();
};

/**
 * Usage: const { concern, error, isLoading } = useConcernById(id)
 */
export function useUserById(id: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/api/user/${id}` : null,
    fetcher
  );

  return {
    userData: data,
    userError: error,
    userLoading: isLoading,
    mutate,
  };
}

export const fetcher = async (url: string) => {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch cashins");
  return res.json();
};

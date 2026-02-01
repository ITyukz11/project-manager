export const getBadgeColor = (role: string) => {
  if (role === "SENIOR") return "bg-yellow-200/20 dark:bg-yellow-500/20";
  if (role === "MASTER") return "bg-blue-200/20 dark:bg-cyan-500/20";
  if (role === "AGENT") return "bg-red-200/20 dark:bg-red-500/20";
  return "bg-gray-200/20 dark:bg-gray-700/20"; // fallback
};

export const roleStyles: Record<string, string> = {
  SENIOR:
    "bg-yellow-300/20 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-300",
  MASTER: "bg-blue-300/20 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-300",
  AGENT: "bg-red-300/20 dark:bg-red-500/20 text-red-600 dark:text-red-300",
  AMOUNT:
    "bg-green-300/20 dark:bg-green-500/20 text-green-800 dark:text-green-300",
};

export const roleStylesText: Record<string, string> = {
  ADMIN: "text-red-600 dark:text-red-300",
  SENIOR: "text-yellow-600 dark:text-yellow-300",
  MASTER: "text-cyan-600 dark:text-cyan-300",
  AGENT: "text-gray-700 dark:text-slate-300",
  AMOUNT: "text-green-800 dark:text-green-300",
};

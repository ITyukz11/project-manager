export const getBadgeColor = (role: string) => {
  if (role === "SENIOR") return "bg-primary/10";
  if (role === "MASTER") return "bg-blue-100/10";
  if (role === "AGENT") return "bg-red-100/10";
};

export const roleStyles: Record<string, string> = {
  ADMIN: "bg-red-500/10 text-red-500 border-red-500/30",
  SENIOR: "bg-primary/10 text-primary  border-primary/30",
  MASTER: "bg-cyan-400/10 text-cyan-400  border-cyan-400/30",
  AGENT: "bg-gray-slate/10 text-slate-300  border-slate-300/30",
  AMOUNT: "bg-green-100 text-green-800 border-green-300",
};

export const roleStylesText: Record<string, string> = {
  ADMIN: "dark:text-red-300 ",
  SENIOR: "dark:text-yellow-300 ",
  MASTER: "dark:text-cyan-300 ",
  AGENT: "dark:text-slate-300 ",
};

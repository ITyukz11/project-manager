// lib/types/role.ts
export const ROLES = {
  ADMIN: "ADMIN",
  TL: "TL",
  LOADER: "LOADER",
  ACCOUNTING: "ACCOUNTING",
  FAP: "FAP",
  MASTER_AGENT: "MASTER_AGENT",
} as const;

export type ROLE = (typeof ROLES)[keyof typeof ROLES];

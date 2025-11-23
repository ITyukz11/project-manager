// lib/types/role.ts
export const ADMINROLES = {
  SUPERADMIN: "SUPERADMIN",
  ADMIN: "ADMIN",
  TL: "TL",
  LOADER: "LOADER",
  ACCOUNTING: "ACCOUNTING",
} as const;

export type ADMINROLES = (typeof ADMINROLES)[keyof typeof ADMINROLES];

// lib/types/role.ts
export const NETWORKROLES = {
  FAP: "FAP",
  MASTER_AGENT: "MASTER_AGENT",
} as const;

export type NETWORKROLES = (typeof NETWORKROLES)[keyof typeof NETWORKROLES];

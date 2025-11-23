export type BankType = "BANK" | "EWALLET";

export interface BankData {
  name: string;
  type: BankType;
}

export const BankNames: BankData[] = [
  // E-Wallets
  { name: "GCash", type: "EWALLET" },
  { name: "Maya", type: "EWALLET" }, // PayMaya rebranded to Maya
  { name: "ShopeePay", type: "EWALLET" },
  { name: "GrabPay", type: "EWALLET" },
  { name: "PayPal", type: "EWALLET" },

  // Banks
  { name: "Banco de Oro (BDO)", type: "BANK" },
  { name: "Bank of the Philippine Islands (BPI)", type: "BANK" },
  { name: "Metropolitan Bank & Trust Co. (Metrobank)", type: "BANK" },
  { name: "Land Bank of the Philippines (Landbank)", type: "BANK" },
  { name: "Philippine National Bank (PNB)", type: "BANK" },
  { name: "Security Bank", type: "BANK" },
  { name: "UnionBank", type: "BANK" },
  { name: "RCBC", type: "BANK" },
  { name: "China Bank", type: "BANK" },
  { name: "EastWest Bank", type: "BANK" },
  { name: "PSBank", type: "BANK" },
  { name: "CIMB Bank", type: "BANK" },
  { name: "Citibank", type: "BANK" },
  { name: "Development Bank of the Philippines (DBP)", type: "BANK" },
  { name: "HSBC", type: "BANK" },
  { name: "Maybank", type: "BANK" },
  { name: "UCPB", type: "BANK" },
];

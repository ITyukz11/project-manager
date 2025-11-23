export function formatAmount(value: number | string): string {
  // Remove commas and non-numeric characters except digits
  const raw =
    typeof value === "string" ? value.replace(/,/g, "") : value.toString();
  // If user is still typing, allow empty string
  if (!raw || isNaN(Number(raw))) return "";
  // Format with no decimals
  return Number(raw).toLocaleString("en-US", {
    maximumFractionDigits: 0,
  });
}

export function formatPhpAmount(value: number | string): string {
  // Remove commas if string, convert to number
  const num =
    typeof value === "string" ? Number(value.replace(/,/g, "")) : value;
  if (isNaN(num) || num === null || num === undefined) return "";
  return `₱${num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatAmountWithDecimals(value: number | string): string {
  // Remove commas if string, convert to number
  const num =
    typeof value === "string" ? Number(value.replace(/,/g, "")) : value;
  if (isNaN(num) || num === null || num === undefined) return "";
  return `${num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function toUtcStartOfDay(dateStr: string, offsetHours: number) {
  const localDate = new Date(dateStr);
  localDate.setHours(0, 0, 0, 0); // start of local day
  // shift to UTC
  const utcDate = new Date(localDate.getTime() - offsetHours * 60 * 60 * 1000);
  return utcDate;
}

export function toUtcEndOfDay(dateStr: string, offsetHours: number) {
  const localDate = new Date(dateStr);
  localDate.setHours(23, 59, 59, 999); // end of local day
  const utcDate = new Date(localDate.getTime() - offsetHours * 60 * 60 * 1000);
  return utcDate;
}

export function toUtcStartOfDay(dateStr: string, tzOffsetHours: number) {
  // Parse the date string as local date (ignore server TZ)
  const [year, month, day] = dateStr.split("-").map(Number);
  // month is 0-indexed
  const localMidnight = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  // Shift forward by timezone offset to get UTC equivalent
  localMidnight.setUTCHours(localMidnight.getUTCHours() - tzOffsetHours);
  return localMidnight;
}

export function toUtcEndOfDay(dateStr: string, tzOffsetHours: number) {
  const [year, month, day] = dateStr.split("-").map(Number);
  const localEnd = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
  localEnd.setUTCHours(localEnd.getUTCHours() - tzOffsetHours);
  return localEnd;
}

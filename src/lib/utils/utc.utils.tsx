// --- Convert local date string to UTC start/end of day ---
export function toUtcStartOfDay(dateStr: string, tzOffsetHours = 8): Date {
  const localDate = new Date(dateStr);
  return new Date(
    Date.UTC(
      localDate.getFullYear(),
      localDate.getMonth(),
      localDate.getDate(),
      0 - tzOffsetHours, // shift local midnight to UTC
      0,
      0,
      0,
    ),
  );
}

export function toUtcEndOfDay(dateStr: string, tzOffsetHours = 8): Date {
  const localDate = new Date(dateStr);
  return new Date(
    Date.UTC(
      localDate.getFullYear(),
      localDate.getMonth(),
      localDate.getDate(),
      23 - tzOffsetHours, // shift local 23:59:59 to UTC
      59,
      59,
      999,
    ),
  );
}

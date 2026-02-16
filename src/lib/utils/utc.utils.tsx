const isProd = process.env.NODE_ENV === "production"; // or process.env.ENV === "prod"

// --- Convert local date string to UTC start of day ---
export function toUtcStartOfDay(dateStr: string, tzOffsetHours = 8): Date {
  if (!isProd) {
    // ===== DEV version =====
    console.log("DEV: Converting to UTC start of day:", {
      dateStr,
      tzOffsetHours,
    });
    const localDate = new Date(dateStr);
    console.log("DEV: Parsed local date:", localDate.toISOString());
    return new Date(
      Date.UTC(
        localDate.getFullYear(),
        localDate.getMonth(),
        localDate.getDate(),
        0 - tzOffsetHours,
        0,
        0,
        0,
      ),
    );
  } else {
    // ===== PROD version =====
    const finalDate = new Date(dateStr);
    const year = finalDate.getUTCFullYear();
    const month = finalDate.getUTCMonth();
    const day = finalDate.getUTCDate();
    return new Date(Date.UTC(year, month, day, 0 - tzOffsetHours, 0, 0, 0));
  }
}

// --- Convert local date string to UTC end of day ---
export function toUtcEndOfDay(dateStr: string, tzOffsetHours = 8): Date {
  if (!isProd) {
    // ===== DEV version =====
    console.log("DEV: Converting to UTC end of day:", {
      dateStr,
      tzOffsetHours,
    });
    const localDate = new Date(dateStr);
    console.log("DEV: Parsed local date:", localDate.toISOString());
    return new Date(
      Date.UTC(
        localDate.getFullYear(),
        localDate.getMonth(),
        localDate.getDate(),
        23, //- tzOffsetHours,
        59,
        59,
        999,
      ),
    );
  } else {
    // ===== PROD version =====
    const finalDate = new Date(dateStr);
    const year = finalDate.getUTCFullYear();
    const month = finalDate.getUTCMonth();
    const day = finalDate.getUTCDate();
    return new Date(
      Date.UTC(year, month, day, 23 - tzOffsetHours, 59, 59, 999),
    );
  }
}

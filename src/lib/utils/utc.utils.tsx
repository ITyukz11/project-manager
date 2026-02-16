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

// const isProd = process.env.NODE_ENV === "production"; // or process.env.ENV === "prod"

// // --- Convert local date string to UTC start of day ---
// export function toUtcStartOfDay(dateStr: string, tzOffsetHours = 8): Date {
//   if (!isProd) {
//     // ===== DEV version =====
//     console.log("DEV: Converting to UTC start of day:", {
//       dateStr,
//       tzOffsetHours,
//     });
//     const localDate = new Date(dateStr);
//     console.log("DEV: Parsed local date:", localDate.toISOString());
//     return new Date(
//       Date.UTC(
//         localDate.getFullYear(),
//         localDate.getMonth(),
//         localDate.getDate(),
//         0 - tzOffsetHours,
//         0,
//         0,
//         0,
//       ),
//     );
//   } else {
//     // ===== PROD version =====
//     const localDate = new Date(dateStr);
//     return new Date(
//       Date.UTC(
//         localDate.getFullYear(),
//         localDate.getMonth(),
//         localDate.getDate(),
//         0 - tzOffsetHours, // shift local midnight to UTC
//         0,
//         0,
//         0,
//       ),
//     );
//   }
// }

// // --- Convert local date string to UTC end of day ---
// export function toUtcEndOfDay(dateStr: string, tzOffsetHours = 8): Date {
//   if (!isProd) {
//     // ===== DEV version =====
//     console.log("DEV: Converting to UTC end of day:", {
//       dateStr,
//       tzOffsetHours,
//     });
//     const localDate = new Date(dateStr);
//     console.log("DEV: Parsed local date:", localDate.toISOString());
//     return new Date(
//       Date.UTC(
//         localDate.getFullYear(),
//         localDate.getMonth(),
//         localDate.getDate(),
//         23 - tzOffsetHours,
//         59,
//         59,
//         999,
//       ),
//     );
//   } else {
//     // ===== PROD version =====
//     const localDate = new Date(dateStr);
//     return new Date(
//       Date.UTC(
//         localDate.getFullYear(),
//         localDate.getMonth(),
//         localDate.getDate(),
//         23 - tzOffsetHours, // shift local 23:59:59 to UTC
//         59,
//         59,
//         999,
//       ),
//     );
//   }
// }

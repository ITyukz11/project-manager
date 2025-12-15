import useSWR from "swr";
import type { Attendance, User } from "@prisma/client";

/**
 * Attendance record returned from the API with optional user info populated.
 */
export type AttendanceWithUser = Attendance & {
  user?: User | null;
};

const fetchAttendanceLogs = async ([url, method]: [string, string]) => {
  const res = await fetch(url, { method });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      body?.error || `Failed to fetch attendance logs (status ${res.status})`
    );
  }
  return res.json() as Promise<AttendanceWithUser[]>;
};

/**
 * SWR hook to fetch attendance logs.
 * - If userId is provided, the hook calls: /api/attendance/logs?userId=<userId>
 * - If userId is omitted, the hook calls: /api/attendance/logs (returns all logs)
 *
 * The API is expected to return an array of AttendanceWithUser objects.
 * Auto-refreshes every 5 seconds.
 */
export const useAttendanceLogs = (userId?: string) => {
  const url = userId
    ? `/api/attendance/logs?userId=${encodeURIComponent(userId)}`
    : "/api/attendance/logs";

  const { data, error, mutate } = useSWR<AttendanceWithUser[]>(
    [url, "GET"],
    fetchAttendanceLogs,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      refreshInterval: 10000, // auto refresh every 10 seconds
    }
  );

  return {
    attendanceLogs: data ?? [],
    attendanceLoading: !error && !data,
    attendanceError: error,
    refetchAttendance: mutate,
  };
};

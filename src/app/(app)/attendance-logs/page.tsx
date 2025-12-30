"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable } from "@/components/table/data-table";
import { useSession } from "next-auth/react";
import { useAttendanceLogs } from "@/lib/hooks/swr/attendance/useAttendanceLogs";
import { TriangleAlert } from "lucide-react";
import { attendanceColumns } from "@/components/table/attendance/attendanceColumns";
import { ADMINROLES } from "@/lib/types/role";

export default function AttendanceLogsPage() {
  const { data: session } = useSession();

  const isAdmin =
    session?.user?.role === ADMINROLES.SUPERADMIN ||
    session?.user?.role === ADMINROLES.ADMIN;

  const userId = !isAdmin ? session?.user?.id : undefined;

  const { attendanceLogs, attendanceError, attendanceLoading } =
    useAttendanceLogs(userId ?? undefined);

  return (
    <Card>
      <CardContent>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Attendance Logs</h1>
          {attendanceError && <TriangleAlert className="text-red-500" />}
        </div>

        {attendanceLoading ? (
          <div className="w-full flex flex-col gap-2 items-center">
            <Skeleton className="w-full h-10" />
            <Skeleton className="w-full h-40" />
          </div>
        ) : (
          <DataTable
            data={attendanceLogs ?? []}
            columns={attendanceColumns}
            allowSelectRow={false}
            hiddenColumns={[]}
            cursorRowSelect
            allowExportData={true}
          />
        )}
      </CardContent>
    </Card>
  );
}

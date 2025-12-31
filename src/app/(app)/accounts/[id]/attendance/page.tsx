"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable } from "@/components/table/data-table";
import { useAttendanceLogs } from "@/lib/hooks/swr/attendance/useAttendanceLogs";
import { TriangleAlert } from "lucide-react";
import { attendanceColumns } from "@/components/table/attendance/attendanceColumns";
import { useParams } from "next/navigation";

export function UserAttendanceTab() {
  const params = useParams();

  const { attendanceLogs, attendanceError, attendanceLoading } =
    useAttendanceLogs(params.id as string);

  return (
    <div>
      {attendanceError && <TriangleAlert className="text-red-500" />}

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
    </div>
  );
}

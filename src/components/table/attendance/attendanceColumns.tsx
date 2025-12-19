"use client";

import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { DataTableColumnHeader } from "@/components/table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import type { AttendanceWithUser } from "@/lib/hooks/swr/attendance/useAttendanceLogs";

/**
 * Columns for Attendance logs table.
 *
 * Matches your Prisma Attendance model:
 * - id, userId, time, particular, active, context, ipAddress, device, createdAt, updatedAt
 * and includes a related `user` object when available.
 *
 * NOTE: device & ip columns use truncate + title so long text shows ellipsis and full value on hover.
 */
export const attendanceColumns: ColumnDef<AttendanceWithUser>[] = [
  {
    id: "user",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="User" />
    ),
    accessorFn: (row) =>
      row.user ?? {
        id: row.userId,
        name: row.userId,
        username: undefined,
        role: undefined,
      },
    cell: ({ getValue }) => {
      const u = getValue() as NonNullable<AttendanceWithUser["user"]>;
      const display = u?.username ?? u?.name ?? u?.id ?? "Unknown";
      const role = u?.role ?? "";
      return (
        <div className="flex flex-col">
          {u?.id ? (
            <Link
              href={`/users/${u.id}`}
              className="font-medium hover:underline truncate"
            >
              {display}
            </Link>
          ) : (
            <span className="font-medium truncate">{display}</span>
          )}
          <span className="text-xs text-muted-foreground italic">
            {role || "—"}
          </span>
        </div>
      );
    },
    enableHiding: false,
    size: 220,
  },
  {
    accessorKey: "particular",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Particular" />
    ),
    cell: ({ row }) => {
      const action = row.original.particular ?? "unknown";
      const isIn = action.toLowerCase().includes("in");
      return (
        <Badge
          className={`w-fit ${
            isIn
              ? "bg-green-600 text-white"
              : "bg-slate-200 text-muted-foreground"
          }`}
        >
          {action}
        </Badge>
      );
    },
    size: 120,
  },
  {
    accessorKey: "time",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Time" />
    ),
    cell: ({ row }) => {
      const t = row.original.time
        ? new Date(row.original.time)
        : new Date(row.original.createdAt);
      return (
        <div className="text-sm">
          <div className="font-medium">{t.toLocaleTimeString()}</div>
          <div className="text-xs text-muted-foreground">
            {t.toLocaleDateString()}
          </div>
        </div>
      );
    },
    size: 160,
  },

  {
    accessorKey: "ipAddress",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="IP Address" />
    ),
    cell: ({ row }) => {
      const ip = row.original.ipAddress ?? "—";
      return (
        <div
          title={ip}
          className="font-mono text-sm truncate max-w-[140px] whitespace-nowrap overflow-hidden"
        >
          {ip}
        </div>
      );
    },
    size: 160,
  },
  {
    accessorKey: "device",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Device" />
    ),
    cell: ({ row }) => {
      const device = row.original.device ?? "—";
      return (
        <div
          title={device}
          className="text-sm text-muted-foreground truncate max-w-[220px] whitespace-nowrap overflow-hidden"
        >
          {device}
        </div>
      );
    },
    size: 240,
  },
];

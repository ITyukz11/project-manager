"use client";

import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { DataTableColumnHeader } from "@/components/table/data-table-column-header";
import { Badge } from "@/components/ui/badge";

/**
 * Type definition for online user data from the API
 */
export type OnlineUser = {
  id: string;
  name: string;
  username: string;
  email: string | null;
  role: string;
  time: string | null;
  ipAddress: string | null;
  device: string | null;
  isClockedIn: boolean;
  lastClockIn: {
    id: string;
    time: string;
    ipAddress: string | null;
    device: string | null;
  } | null;
};

/**
 * Columns for Current Online Users table.
 */
export const currentOnlineColumns: ColumnDef<OnlineUser>[] = [
  {
    id: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const isClockedIn = row.original.isClockedIn;
      return (
        <div className="flex items-center gap-2">
          {isClockedIn && (
            <>
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              <span className="text-xs font-medium text-green-600">Online</span>
            </>
          )}
        </div>
      );
    },
    enableHiding: false,
    size: 100,
  },
  {
    id: "user",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="User" />
    ),
    accessorFn: (row) => row.name,
    cell: ({ row }) => {
      const user = row.original;
      return (
        <div className="flex flex-col">
          <Link
            href={`/users/${user.id}`}
            className="font-medium hover:underline truncate"
          >
            {user.name}
          </Link>
          <span className="text-xs text-muted-foreground">
            @{user.username}
          </span>
        </div>
      );
    },
    enableHiding: false,
    size: 220,
  },
  {
    accessorKey: "role",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Role" />
    ),
    cell: ({ row }) => {
      const role = row.original.role;
      return (
        <Badge variant="outline" className="w-fit">
          {role}
        </Badge>
      );
    },
    size: 120,
  },
  {
    accessorKey: "time",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Clocked In At" />
    ),
    cell: ({ row }) => {
      const timeStr = row.original.time;
      if (!timeStr)
        return <span className="text-xs text-muted-foreground">—</span>;

      const t = new Date(timeStr);
      const now = new Date();
      const diffMs = now.getTime() - t.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHrs = Math.floor(diffMins / 60);

      let timeAgo = "";
      if (diffHrs > 0) {
        timeAgo = `${diffHrs}h ${diffMins % 60}m ago`;
      } else {
        timeAgo = `${diffMins}m ago`;
      }

      return (
        <div className="text-sm">
          <div className="font-medium">{t.toLocaleTimeString()}</div>
          <div className="text-xs text-muted-foreground">
            {t.toLocaleDateString()} • {timeAgo}
          </div>
        </div>
      );
    },
    size: 200,
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

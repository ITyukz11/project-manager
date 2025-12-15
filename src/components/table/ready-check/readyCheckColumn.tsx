"use client";

import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { DataTableColumnHeader } from "@/components/table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import {
  ReadyCheck,
  ReadyCheckParticipant,
} from "@/lib/hooks/swr/ready-check/useReadyChecks";

/**
 * Columns for ReadyCheck table.
 *
 * Matches the ReadyCheck type returned by useReadyChecks:
 * - id, initiator, context, startedAt, endedAt, totalParticipants, totalClockedIn, participants[]
 *
 * Participant counts and ready counts are derived from participants[].
 */
export const readyCheckColumns: ColumnDef<ReadyCheck>[] = [
  {
    id: "initiator",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Initiator" />
    ),
    accessorFn: (row) =>
      row.initiator ?? {
        id: "",
        name: "Unknown",
        username: undefined,
        role: undefined,
      },
    cell: ({ getValue }) => {
      const ini = getValue() as ReadyCheck["initiator"];
      const display = ini?.username ?? ini?.name ?? ini?.id ?? "Unknown";
      return (
        <div className="flex flex-col">
          {ini?.id ? (
            <Link
              href={`/users/${ini.id}`}
              className="font-medium hover:underline truncate"
            >
              {display}
            </Link>
          ) : (
            <span className="font-medium truncate">{display}</span>
          )}
          <span className="text-xs text-muted-foreground">
            @{ini?.role ?? "—"}
          </span>
        </div>
      );
    },
    enableHiding: false,
    size: 220,
  },

  {
    accessorKey: "startedAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Started" />
    ),
    cell: ({ row }) => {
      const started = row.original.startedAt
        ? new Date(row.original.startedAt)
        : new Date(row.original.createdAt ?? Date.now());
      return (
        <div className="text-sm">
          <div className="font-medium">{started.toLocaleDateString()}</div>
          <div className="text-xs text-muted-foreground">
            {started.toLocaleTimeString()}
          </div>
        </div>
      );
    },
    size: 160,
  },
  {
    accessorKey: "endedAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Ended" />
    ),
    cell: ({ row }) => {
      const ended = row.original.endedAt
        ? new Date(row.original.endedAt)
        : null;
      if (!ended)
        return <span className="text-sm text-muted-foreground">—</span>;
      return (
        <div className="text-sm">
          <div className="font-medium">{ended.toLocaleDateString()}</div>
          <div className="text-xs text-muted-foreground">
            {ended.toLocaleTimeString()}
          </div>
        </div>
      );
    },
    size: 160,
  },
  {
    accessorKey: "totalParticipants",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Participants" />
    ),
    cell: ({ row }) => {
      const total =
        row.original.totalParticipants ??
        row.original.participants?.length ??
        0;
      return <span className="font-mono">{total}</span>;
    },
    size: 120,
  },
  {
    id: "totalClockedIn",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Clocked In" />
    ),
    accessorFn: (row) =>
      row.totalClockedIn ??
      row.participants?.filter((p) => p.wasClockedIn).length ??
      0,
    cell: ({ getValue }) => (
      <span className="font-mono">{getValue() as number}</span>
    ),
    size: 120,
  },
  {
    id: "readyCount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Ready" />
    ),
    accessorFn: (row) =>
      row.participants?.filter((p: ReadyCheckParticipant) => p.responded)
        .length ?? 0,
    cell: ({ getValue, row }) => {
      const ready = getValue() as number;
      const total =
        row.original.totalParticipants ??
        row.original.participants?.length ??
        0;
      const allReady = total > 0 && ready === total;
      return (
        <Badge
          className={`w-fit ${
            allReady
              ? "bg-green-600 text-white"
              : "bg-slate-200 text-muted-foreground"
          }`}
        >
          {ready}/{total}
        </Badge>
      );
    },
    size: 120,
  },
];

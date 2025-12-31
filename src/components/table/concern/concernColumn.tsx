"use client";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { DataTableColumnHeader } from "../data-table-column-header";
import {
  getStatusColorClass,
  getStatusIcon,
} from "@/components/getStatusColorClass";

// Assuming Cashout type
export type ConcernForTable = {
  id: string;
  subject: string;
  details: string;
  status: string;

  createdAt: Date;
  updatedAt: Date;
  user?: { id: string; name?: string; accName?: string };
  attachments: { id: string; url: string; filename?: string }[];
  concernThreads: { id: string; message: string }[];
};

export const concernColumn: ColumnDef<ConcernForTable>[] = [
  {
    accessorKey: "entryBy",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Entry By" />
    ),
    cell: ({ row }) => {
      const concern = row.original;
      // Show Admin's name if present, else NetworkUser name
      const entry = concern.user?.name || "—";
      return <span className="font-medium">{entry}</span>;
    },
  },
  {
    accessorKey: "subject",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Subject" />
    ),
    cell: ({ row }) => (
      <span className=" font-mono">{row.original.subject}</span>
    ),
  },
  {
    accessorKey: "details",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Details" />
    ),
    cell: ({ row }) => {
      const details = row.original.details || "";
      const maxLength = 80;
      const truncated =
        details.length > maxLength
          ? details.substring(0, maxLength) + "..."
          : details;
      return <span title={details}>{truncated}</span>;
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => (
      <Badge
        className={`w-fit capitalize ${getStatusColorClass(
          row.original.status
        )}`}
      >
        {getStatusIcon(row.original.status)}
        {row.original.status}
      </Badge>
    ),
  },
  {
    accessorKey: "updatedAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Updated At" />
    ),
    cell: ({ row }) => (
      <span className="font-mono text-xs">
        {format(new Date(row.original.updatedAt), "MMM. dd, yyyy h:mm:aa")}
      </span>
    ),
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created At" />
    ),
    cell: ({ row }) => (
      <span className="font-mono text-xs">
        {format(new Date(row.original.createdAt), "MMM. dd, yyyy h:mm:aa")}
      </span>
    ),
  },
  {
    accessorKey: "concernThreads",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Threads" />
    ),
    cell: ({ row }) => (
      <span className="font-mono text-xs">
        {row.original.concernThreads?.length ?? 0} msgs
      </span>
    ),
  },
];

"use client";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { DataTableColumnHeader } from "../data-table-column-header";
import { formatAmountWithDecimals } from "@/components/formatAmount";
import {
  getStatusColorClass,
  getStatusIcon,
} from "@/components/getStatusColorClass";

// Assuming Cashin type
export type CashinForTable = {
  id: string;
  amount: number;
  userName: string;
  details: string;
  status: string;
  transactionRequestId?: string;
  createdAt: Date;
  updatedAt: Date;
  createdByAdmin?: { id: string; name?: string };
  user?: { id: string; name?: string; accName?: string };
  attachments: { id: string; url: string; filename?: string }[];
  _count: { cashinThreads: number };
};

export const CashinColumns: ColumnDef<CashinForTable>[] = [
  {
    accessorKey: "entryBy",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Entry By" />
    ),
    cell: ({ row }) => {
      const Cashin = row.original;
      const isGateway = !!Cashin.transactionRequestId;

      // Show Admin's name if present, else NetworkUser name
      const entry = Cashin.createdByAdmin?.name || Cashin.user?.name || "";

      return (
        <span className="font-medium flex items-center gap-1">
          {isGateway && (
            <span className="relative inline-flex">
              {/* Ping layer (only when PENDING) */}
              {Cashin.status === "COMPLETED" && (
                <span className="absolute inset-0 rounded-lg bg-blue-400 opacity-75 animate-pulse">
                  GATEWAY
                </span>
              )}

              {/* Main label */}
              <span className="relative z-10 rounded-lg bg-blue-100 border border-blue-300 px-2 py-0.5 text-xs font-semibold text-blue-900">
                GATEWAY
              </span>
            </span>
          )}

          <span>{entry}</span>
        </span>
      );
    },
  },

  {
    accessorKey: "userName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Username" />
    ),
    cell: ({ row }) => {
      // Show Admin's name if present, else NetworkUser name
      return <span className="font-medium">{row.original.userName}</span>;
    },
  },
  {
    accessorKey: "amount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Amount" />
    ),
    cell: ({ row }) => (
      <span className=" text-green-700 dark:text-green-500 font-mono">
        {formatAmountWithDecimals(row.original.amount)}
      </span>
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
    accessorKey: "_count.cashinThreads",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Threads" />
    ),
    cell: ({ row }) => (
      <span className="font-mono text-xs">
        {row.original._count.cashinThreads} msgs
      </span>
    ),
  },
];

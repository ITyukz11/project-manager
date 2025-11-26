"use client";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { DataTableColumnHeader } from "../data-table-column-header";
import { Label } from "@/components/ui/label";
import { formatAmountWithDecimals } from "@/components/formatAmount";

// Assuming Cashout type
export type CashoutForTable = {
  id: string;
  amount: number;
  userName: string;
  details: string;
  status: string;

  createdAt: Date;
  updatedAt: Date;
  createdByAdmin?: { id: string; name?: string };
  user?: { id: string; name?: string; accName?: string };
  attachments: { id: string; url: string; filename?: string }[];
  cashoutThreads: { id: string; message: string }[];
};

export const cashoutColumns: ColumnDef<CashoutForTable>[] = [
  {
    accessorKey: "entryBy",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Entry By" />
    ),
    cell: ({ row }) => {
      const cashout = row.original;
      // Show Admin's name if present, else NetworkUser name
      const entry = cashout.createdByAdmin?.name || cashout.user?.name || "—";
      return <span className="font-medium">{entry}</span>;
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
        className={`w-fit capitalize ${
          row.original.status === "PENDING"
            ? "bg-yellow-400 text-black"
            : row.original.status === "COMPLETED"
            ? "bg-green-600 text-white"
            : "bg-red-600 text-white"
        }`}
      >
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
    accessorKey: "cashoutThreads",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Threads" />
    ),
    cell: ({ row }) => (
      <span className="font-mono text-xs">
        {row.original.cashoutThreads.length} msgs
      </span>
    ),
  },
];

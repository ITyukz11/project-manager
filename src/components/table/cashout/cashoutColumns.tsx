"use client";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { DataTableColumnHeader } from "../data-table-column-header";

// Assuming Cashout type
export type CashoutForTable = {
  id: string;
  amount: number;
  mop: string;
  accName: string;
  accNumber: string;
  bankName: string;
  status: string;
  loaderTip: number;
  agentTip: number;
  masterAgentTip: number;
  createdAt: Date;
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
    accessorKey: "amount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Amount" />
    ),
    cell: ({ row }) => (
      <span className="font-semibold text-green-600 font-mono">
        {row.original.amount.toLocaleString()}
      </span>
    ),
  },

  {
    accessorKey: "bankName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Bank/E-wallet" />
    ),
    cell: ({ row }) => <span>{row.original.bankName}</span>,
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
    accessorKey: "accName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Account Name" />
    ),
    cell: ({ row }) => <span>{row.original.accName}</span>,
  },
  {
    accessorKey: "accNumber",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Account Number" />
    ),
    cell: ({ row }) => (
      <span className="font-mono">{row.original.accNumber}</span>
    ),
  },

  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created At" />
    ),
    cell: ({ row }) => (
      <span className="font-mono text-xs">
        {format(new Date(row.original.createdAt), "MMM dd, yyyy HH:mm")}
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

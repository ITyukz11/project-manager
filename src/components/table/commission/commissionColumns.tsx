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
import { getBadgeColor, roleStyles } from "@/lib/utils/roleColors";

// Assuming Commission type
export type CommissionForTable = {
  id: string;
  amount: number;
  userName: string;
  role: string;
  details: string;
  status: string;
  transactionRequestId?: string;
  createdAt: Date;
  updatedAt: Date;
  createdByAdmin?: { id: string; name?: string };
  user?: { id: string; name?: string; accName?: string };
  attachments: { id: string; url: string; filename?: string }[];
  _count: { commissionThreads: number };
};

export const commissionColumns: ColumnDef<CommissionForTable>[] = [
  {
    accessorKey: "userName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Role/Username" />
    ),
    cell: ({ row }) => {
      // Show Admin's name if present, else NetworkUser name
      return (
        <span className="relative inline-flex gap-1">
          <Badge className={`${roleStyles[row.original.role]}`}>
            {row.original.role}
          </Badge>
          {row.original.userName}
        </span>
      );
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
    id: "details",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Details" />
    ),
    cell: ({ row }) => {
      const details = row.original.details || "";
      const maxLength = 20;
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
          row.original.status,
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
    accessorKey: "_count.commissionThreads",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Threads" />
    ),
    cell: ({ row }) => (
      <span className="font-mono text-xs">
        {row.original._count.commissionThreads} msgs
      </span>
    ),
  },
];

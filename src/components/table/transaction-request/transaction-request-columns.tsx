"use client";
import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "../data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";
import { CasinoGroup, TransactionRequest, User } from "@prisma/client";
import { TransactionRequestActionMenu } from "./TransactionRequestAction";
import { formatAmountWithDecimals } from "@/components/formatAmount";
import { formatDate } from "date-fns";

import {
  getStatusColorClass,
  getStatusIcon,
} from "@/components/getStatusColorClass";

export const transactionRequestColumns: ColumnDef<
  TransactionRequest & { processedBy: User; casinoGroup: CasinoGroup }
>[] = [
  {
    accessorKey: "username",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Player" />
    ),
    cell: ({ row }) => {
      return (
        <div className="flex flex-col">
          <p className="font-semibold text-sm">{row.original.username}</p>
        </div>
      );
    },
  },
  {
    accessorKey: "type",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Type" />
    ),
    cell: ({ row }) => {
      const type = row.getValue("type") as string;
      return (
        <Badge className={`${getStatusColorClass(type)}`}>
          {getStatusIcon(type)}
          {type}
        </Badge>
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
    accessorKey: "paymentMethod",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Method" />
    ),
    cell: ({ row }) => {
      const method = row.getValue("paymentMethod") as string | null;
      return (
        <span className="text-sm">
          {method || <span className="text-muted-foreground">N/A</span>}
        </span>
      );
    },
  },
  {
    accessorKey: "receiptUrl",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Receipt" />
    ),
    cell: ({ row }) => {
      const receiptUrl = row.getValue("receiptUrl") as string | null;

      if (!receiptUrl) {
        return (
          <span className="text-xs text-muted-foreground">No receipt</span>
        );
      }

      return (
        <a
          href={receiptUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
        >
          View Receipt
          <ExternalLink className="h-3 w-3" />
        </a>
      );
    },
  },
  {
    accessorKey: "bankDetails",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Bank Details" />
    ),
    cell: ({ row }) => {
      const bankDetails = row.getValue("bankDetails") as string | null;

      if (!bankDetails) {
        return <span className="text-xs text-muted-foreground">N/A</span>;
      }

      return (
        <div className="max-w-[200px] text-xs truncate" title={bankDetails}>
          {bankDetails}
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.getValue("status") as string;

      return (
        <div className="flex flex-col">
          <Badge className={`w-fit ${getStatusColorClass(status)}`}>
            {getStatusIcon(status)}
            {status}
          </Badge>
          {row.original.processedBy && (
            <span className="text-xs text-muted-foreground">
              by {row.original.processedBy.username}
            </span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Date/Time" />
    ),
    cell: ({ row }) => {
      const createdAt = new Date(row.getValue("createdAt"));

      return (
        <div className="flex flex-col">
          <span className="text-sm">{formatDate(createdAt, "hh:mm a")}</span>
          <span className="text-xs text-muted-foreground">
            {formatDate(createdAt, "MM/dd/yyyy")}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "remarks",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Remarks" />
    ),
    cell: ({ row }) => {
      const remarks = row.original.remarks as string | null;
      return (
        <div className="max-w-[200px] truncate text-sm">
          {remarks || <span className="text-muted-foreground">-</span>}
        </div>
      );
    },
  },
  {
    id: "action",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Actions" />
    ),
    cell: ({ row }) => (
      <TransactionRequestActionMenu transactionId={row.original.id} />
    ),
  },
];

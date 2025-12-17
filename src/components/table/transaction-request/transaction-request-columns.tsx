"use client";
import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "../data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";
import { CasinoGroup, TransactionRequest, User } from "@prisma/client";
import { TransactionRequestActionMenu } from "./TransactionRequestAction";

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
        <Badge
          className={`${
            type === "CASHIN"
              ? "bg-green-600 hover:bg-green-700"
              : "bg-orange-600 hover:bg-orange-700"
          } text-white`}
        >
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
    cell: ({ row }) => {
      const amount = row.getValue("amount") as number;
      return (
        <span className="font-semibold text-sm">
          ₱{amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
        </span>
      );
    },
  },
  {
    accessorKey: "paymentMethod",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Payment Method" />
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
          <Badge
            className={`w-fit ${
              status === "PENDING"
                ? "bg-yellow-600 hover:bg-yellow-700 text-white"
                : status === "COMPLETED"
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-red-500 hover:bg-red-600 text-white"
            }`}
          >
            {status}
          </Badge>
          {row.original.processedBy && (
            <span className="text-xs text-muted-foreground mt-1">
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
      <DataTableColumnHeader column={column} title="Created At" />
    ),
    cell: ({ row }) => {
      const createdAt = new Date(row.getValue("createdAt"));
      const formattedDate = createdAt.toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
      });
      const formattedTime = createdAt.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
      return (
        <div className="flex flex-col">
          <span className="text-sm">{formattedDate}</span>
          <span className="text-xs text-muted-foreground">{formattedTime}</span>
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

import {
  getStatusColorClass,
  getStatusIcon,
} from "@/components/getStatusColorClass";
import { DataTableColumnHeader } from "@/components/table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Commission } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";

// Helper for currency formatting
function formatPhp(value: string | number) {
  return Number(value).toLocaleString("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  });
}

type WithdrawColumnsProps = {
  onViewThread: (commissionId: string) => void;
};

export const withdrawHistoryColumns = ({
  onViewThread,
}: WithdrawColumnsProps): ColumnDef<Commission>[] => [
  {
    accessorKey: "createdAt",
    header: "Date",
    cell: ({ getValue }) =>
      format(new Date(getValue() as string), "MMM. dd, yyyy hh:mm a"),
  },
  {
    accessorKey: "amount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Amount" />
    ),
    cell: ({ getValue }) => (
      <span className="font-bold font-mono text-green-600 dark:text-green-500">
        {formatPhp(getValue() as string)}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => (
      <Badge
        className={`ml-2 capitalize text-xs ${getStatusColorClass(
          row.original.status,
        )}`}
      >
        {getStatusIcon(row.original.status)}
        {row.original.status}
      </Badge>
    ),
  },
  {
    accessorKey: "reason",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Reason" />
    ),
    cell: ({ getValue }) => (
      <span className="font-bold font-mono">
        {(getValue() as string) ?? "-"}
      </span>
    ),
  },
];

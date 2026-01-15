import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format, formatDate, intervalToDuration } from "date-fns";
import Link from "next/link";
import { DpayTransaction } from "@prisma/client";
import { DataTableColumnHeader } from "@/components/table/data-table-column-header";
import { formatAmountWithDecimals } from "@/components/formatAmount";
import {
  getStatusColorClass,
  getStatusIcon,
} from "@/components/getStatusColorClass";
import { Label } from "@/components/ui/label";
import { Check, Copy } from "lucide-react";

function formatDurationObj(dur: {
  hours?: number;
  minutes?: number;
  seconds?: number;
}) {
  const { hours = 0, minutes = 0, seconds = 0 } = dur;
  return [
    hours ? `${hours}h` : null,
    minutes ? `${minutes}mins` : null,
    `${seconds}secs`,
  ]
    .filter(Boolean)
    .join(" ");
}

// This function returns your column definitions, injected with your handleCopy/copy state
export function getDpayTransactionColumns({
  handleCopy,
  copiedId,
}: {
  handleCopy: (id: string) => void;
  copiedId: string | null;
}): ColumnDef<DpayTransaction>[] {
  return [
    {
      accessorKey: "userName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Username" />
      ),
      cell: ({ row }) => {
        const user = row.original;
        const userId = user.referenceUserId;

        return (
          <div className="flex flex-col gap-1 items-start">
            <Label
              className={`font-semibold flex flex-col gap-1 justify-start items-center`}
            >
              {user.userName}
            </Label>
            <span className="text-xs text-muted-foreground flex flex-row items-center gap-1">
              {`#${userId}`}
              {copiedId === userId ? (
                <Check className="w-3 h-3 text-green-500" />
              ) : (
                <Copy
                  className="w-3 h-3 cursor-pointer"
                  onClick={() => handleCopy(userId)}
                />
              )}
            </span>
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
        const type = row.original.type;
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
            {row.original.updatedAt && row.original.status !== "PENDING" && (
              <span className="text-xs text-muted-foreground">
                {formatDurationObj(
                  intervalToDuration({
                    start: new Date(row.original.createdAt),
                    end: new Date(row.original.updatedAt),
                  })
                ) || "0secs"}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "channel",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Channel" />
      ),
      cell: ({ getValue }) => (
        <Badge variant={"default"}>{String(getValue())}</Badge>
      ),
    },

    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Date/Time" />
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
            <span className="text-sm">{formattedTime}</span>
            <span className="text-xs text-muted-foreground">
              {formattedDate}
            </span>
          </div>
        );
      },
    },
    {
      header: "Updated At",
      accessorKey: "updatedAt",
      cell: ({ getValue }) =>
        format(new Date(getValue() as string), "yyyy-MM-dd HH:mm"),
    },
  ];
}

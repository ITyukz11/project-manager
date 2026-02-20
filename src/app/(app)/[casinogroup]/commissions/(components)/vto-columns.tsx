import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/table/data-table-column-header"; // adjust path as needed
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { formatAmount, formatPhpAmount } from "@/components/formatAmount";
import { Decimal } from "@prisma/client/runtime/library";
import { commissionTypeColors } from "./colors";

export type Vto = {
  sourceUserName: string | null;
  id: string;
  dateStart: string;
  dateEnd: string;
  type: string;
  commissionType: string | null;
  userId: string;
  sourceUserId: string;
  sourceUserRole: string;
  points: Decimal;
  totalBet: Decimal | null;
  totalWin: Decimal | null;
  winLoss: Decimal | null;
  betCount: number | null;
  claimed: boolean;
  commissionClaimed: Decimal;
  commissionShare: Decimal;
  createdAt: Date;
  updatedAt: Date;
};

export function getVtoColumns(): ColumnDef<Vto>[] {
  return [
    {
      accessorKey: "sourceUserName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Username" />
      ),
      cell: ({ row }) => (
        <div className="flex flex-col justify-start">
          <span className="text-yellow-400 font-medium">
            {row.original.sourceUserName || "N/A"}
          </span>
          <span className="text-muted-foreground italic">
            {row.original.sourceUserRole}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "date",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Date" />
      ),
      cell: ({ row }) => {
        const { dateStart, dateEnd } = row.original;
        const isSame =
          dateStart &&
          dateEnd &&
          new Date(dateStart).toDateString() ===
            new Date(dateEnd).toDateString();
        return (
          <div className="w-fit flex flex-col">
            {isSame
              ? format(new Date(dateStart), "MMMM dd, yyyy")
              : `${format(new Date(dateStart), "MMM. dd, yyyy")} - ${format(
                  new Date(dateEnd),
                  "MMM. dd, yyyy",
                )}`}
            <div className="flex flex-row w-fit items-center gap-1">
              <span
                className={cn(
                  "text-sm font-medium",
                  commissionTypeColors[
                    row.original
                      .commissionType as keyof typeof commissionTypeColors
                  ],
                )}
              >
                {row.original.commissionType}
              </span>
              |
              <span className="text-muted-foreground">{row.original.type}</span>
            </div>
          </div>
        );
      },
    },

    {
      accessorKey: "points",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="VTO" />
      ),
      cell: ({ row }) => (
        <span
          className={`font-mono ${row.original.commissionType !== "VTO" ? "text-muted-foreground" : "text-green-400"}`}
        >
          {formatAmount(Number(row.original.points))}
        </span>
      ),
    },

    {
      accessorKey: "totalWin",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Total Win" />
      ),
      cell: ({ getValue }) => getValue() ?? "-",
    },
    {
      accessorKey: "winLoss",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Win/Loss" />
      ),
      cell: ({ row }) => (
        <span
          className={`${Number(row.original.winLoss) < 0 ? "text-red-400" : "text-green-400"}`}
        >
          {formatAmount(Number(row.original.winLoss))}
        </span>
      ),
    },
    {
      accessorKey: "betCount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Bet Count" />
      ),
      cell: ({ getValue }) => getValue() ?? "-",
    },
    {
      id: "Share",
      accessorKey: "commissionShare",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Share" />
      ),
      cell: ({ row }) =>
        Number(row.original.commissionShare) === 0 ? (
          "-"
        ) : (
          <span className="font-mono">
            {Number(row.original.commissionShare)}%
          </span>
        ),
    },
    {
      id: "Amount",
      accessorKey: "commissionClaimed",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Amount" />
      ),
      cell: ({ row }) =>
        Number(row.original.commissionClaimed) === 0 ? (
          "-"
        ) : (
          <span className="font-mono font-medium ">
            {formatPhpAmount(Number(row.original.commissionClaimed))}
          </span>
        ),
    },
    {
      id: "Date/Time",
      accessorKey: "updatedAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Date/Time" />
      ),
      cell: ({ row }) =>
        !row.original.updatedAt ? (
          "-"
        ) : (
          <div className="flex flex-col">
            <span className="font-mono">
              {row.original.claimed
                ? format(new Date(row.original.updatedAt), "hh:mm a")
                : null}
            </span>
            <span className="text-muted-foreground">
              {row.original.claimed
                ? format(new Date(row.original.updatedAt), "MMM. dd, yyyy")
                : "Unclaimed"}
            </span>
          </div>
        ),
    },
  ];
}

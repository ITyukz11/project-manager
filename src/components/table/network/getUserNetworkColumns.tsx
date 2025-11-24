"use client";
import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "../data-table-column-header";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { format } from "date-fns";
import { User } from "@prisma/client";

// Props type for any extra data you want to inject, e.g., pathname, casino group, etc.
export type UserNetworkColumnProps = {
  casinoGroup: string;
};

export function getUserNetworkColumns({
  casinoGroup,
}: UserNetworkColumnProps): ColumnDef<
  User & { _count?: { groupChats?: number } }
>[] {
  console.log("casinoGroup in columns:", casinoGroup);
  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({ row }) => {
        return (
          <div className="max-w-[500px] truncate font-medium cursor-default flex flex-row items-center">
            <div className="flex flex-col">
              <Link
                href={`/${casinoGroup}/network/accounts/${row.original.username}`}
                className="text-blue-500 dark:text-blue-400 hover:underline text-sm capitalize"
              >
                {row.original.name}
              </Link>
              <p className="text-bold text-xs text-gray-500">
                {row.original.email}
              </p>
            </div>
          </div>
        );
      },
    },

    {
      accessorKey: "role",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Account Type" />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex space-x-2">
            <Badge className="truncate font-medium">
              {row.getValue("role")}
            </Badge>
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
        // format from `date-fns`
        return (
          <span>
            {format(new Date(row.original.createdAt), "MMM. dd, yyyy")}
          </span>
        );
      },
    },
    {
      accessorKey: "active",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Active" />
      ),
      cell: ({ row }) => {
        const isActive = row.getValue("active") as boolean;

        return (
          <div className="flex flex-col">
            <Badge
              className={`w-fit ${
                isActive
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-red-600 hover:bg-red-700 text-white"
              }`}
            >
              {isActive ? "Yes" : "No"}
            </Badge>
            {!isActive && (
              <span className="text-xs text-muted-foreground mt-1">
                Inactive users cannot access the system.
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "# of GCs",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="# of GCs" />
      ),
      cell: ({ row }) => {
        return (
          <Badge variant={"outline"} className="font-mono">
            {row.original._count?.groupChats ?? 0}
          </Badge>
        );
      },
    },
  ];
}

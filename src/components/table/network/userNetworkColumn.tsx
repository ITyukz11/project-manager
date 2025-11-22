"use client";
import { ColumnDef } from "@tanstack/react-table";
import { NetworkUser } from "@prisma/client";
import { DataTableColumnHeader } from "../data-table-column-header";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { formatDate } from "date-fns";

export const userNetworkColumns: ColumnDef<
  NetworkUser & { _count?: { groupChats?: number } }
>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => {
      return (
        <div className="max-w-[500px] truncate font-medium cursor-default flex flex-row items-center">
          <div className="flex flex-col">
            <p className="text-bold text-sm capitalize">{row.original.name}</p>
            <p className="text-bold text-xs text-gray-500">
              {row.original.email}
            </p>
          </div>
        </div>
      );
    },
  },

  {
    accessorKey: "type",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Account Type" />
    ),
    cell: ({ row }) => {
      return (
        <div className="flex space-x-2">
          <Badge className="truncate font-medium">{row.getValue("type")}</Badge>
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
      return <span>{formatDate(row.original.createdAt, "MMM. dd, yyyy")}</span>;
    },
  },
  {
    accessorKey: "active",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Active" />
    ),
    cell: ({ row }) => {
      const isActive = row.getValue("active") as boolean;

      console.log("isActive: ", isActive);
      return (
        <div className="flex flex-col">
          <Badge
            className={`w-fit ${
              isActive
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-red-500 hover:bg-red-600 text-white"
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
        <Link href="#" className="text-blue-600 hover:underline">
          {row.original._count?.groupChats ?? 0}
        </Link>
      );
    },
  },
];

"use client";
import { ColumnDef } from "@tanstack/react-table";
import { GroupChat } from "@prisma/client";
import { DataTableColumnHeader } from "../data-table-column-header";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Label } from "@/components/ui/label";
import { formatDate } from "date-fns";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export const networkGCManagerColumn: ColumnDef<
  GroupChat & { _count?: { users?: number } }
>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => {
      return (
        <div className="truncate font-medium cursor-default flex flex-row items-center">
          <Link
            href="#"
            className="text-blue-600 hover:underline text-sm capitalize"
          >
            {row.original.name}
          </Link>
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
      const isActive = row.getValue("status") as boolean;

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
            {isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
      );
    },
  },

  {
    accessorKey: "updatedAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Updated At" />
    ),
    cell: ({ row }) => {
      return <span>{formatDate(row.original.updatedAt, "MMM. dd, yyyy")}</span>;
    },
  },
  {
    accessorKey: "# of Users",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="# of Members" />
    ),
    cell: ({ row }) => {
      return (
        <Link href="#" className="text-blue-600 hover:underline">
          {row.original._count?.users ?? 0}
        </Link>
      );
    },
  },
  {
    accessorKey: "action",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Action" />
    ),
    cell: ({ row }) => {
      return (
        <Button size="sm">
          <Plus /> Members
        </Button>
      );
    },
  },
];

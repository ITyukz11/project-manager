"use client";
import { ColumnDef } from "@tanstack/react-table";
import { User } from "@prisma/client";
import { DataTableColumnHeader } from "../data-table-column-header";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export const userColumns: ColumnDef<User>[] = [
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
    accessorKey: "role",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Account Type" />
    ),
    cell: ({ row }) => {
      return (
        <div className="flex space-x-2">
          <span className="max-w-[500px] truncate font-medium">
            {row.getValue("role")}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "messengerLink",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Messenger Link" />
    ),
    cell: ({ row }) => {
      return (
        <Link
          href={row.getValue("messengerLink") ?? "#"}
          className="text-blue-500"
          target="_blank"
        >
          {row.getValue("messengerLink")}
        </Link>
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
      return <span>{formattedDate}</span>;
    },
  },
];

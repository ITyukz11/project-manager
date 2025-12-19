"use client";
import React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { User } from "@prisma/client";
import { DataTableColumnHeader } from "../data-table-column-header";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { UserActionMenu } from "./UserActionMenu";

export type UserWithCasinoGroups = User & {
  casinoGroups?: { id: string; name: string }[];
};

export const userColumns: ColumnDef<UserWithCasinoGroups>[] = [
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
    id: "casinoGroups",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Casino Groups" />
    ),
    accessorFn: (row) =>
      row.casinoGroups?.map((cg) => cg.name).join(", ") || "—",
    cell: ({ row }) => {
      const casinoGroups = row.original.casinoGroups;

      if (!casinoGroups || casinoGroups.length === 0) {
        return (
          <span className="text-xs text-muted-foreground italic">
            No groups assigned
          </span>
        );
      }

      return (
        <div className="flex flex-wrap gap-1">
          {casinoGroups.map((group, index) => (
            <Badge
              key={index}
              variant="outline"
              className="text-xs font-normal"
            >
              {group.name}
            </Badge>
          ))}
        </div>
      );
    },
    filterFn: (row, id, value) => {
      const casinoGroups = row.original.casinoGroups;
      if (!casinoGroups || casinoGroups.length === 0) return false;

      const groupNames = casinoGroups.map((cg) => cg.name.toLowerCase());
      return groupNames.some((name) => name.includes(value.toLowerCase()));
    },
  },

  {
    accessorKey: "messengerLink",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Messenger Link" />
    ),
    cell: ({ row }) => {
      const link = row.getValue("messengerLink") as string | null;

      if (!link) {
        return <span className="text-xs text-muted-foreground">—</span>;
      }

      return (
        <Link
          href={link}
          className="text-blue-500 dark:text-blue-400 hover:underline text-xs truncate max-w-[200px] block"
          target="_blank"
          rel="noopener noreferrer"
        >
          {link}
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

  {
    id: "action",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Actions" />
    ),
    cell: ({ row }) => <UserActionMenu userId={row.original.id} />,
  },
];

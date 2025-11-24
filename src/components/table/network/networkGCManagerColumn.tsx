"use client";
import { ColumnDef } from "@tanstack/react-table";
import { GroupChat, User } from "@prisma/client";
import { DataTableColumnHeader } from "../data-table-column-header";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { formatDate } from "date-fns";
import { NetworkGroupChatEditDialog } from "./NetworkGroupChatAction";
import { Label } from "@/components/ui/label";

export const networkGCManagerColumn: ColumnDef<
  GroupChat & { _count?: { users?: number }; users?: User[] }
>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => {
      return (
        <div className="truncate font-medium cursor-default flex flex-row items-center">
          <Label>{row.original.name}</Label>
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
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created At" />
    ),
    cell: ({ row }) => {
      return <span>{formatDate(row.original.createdAt, "MMM. dd, yyyy")}</span>;
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
        <Badge variant={"outline"} className="font-mono">
          {row.original._count?.users ?? 0}
        </Badge>
      );
    },
  },
  {
    accessorKey: "action",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Action" />
    ),
    cell: ({ row }) => {
      console.log("row original:", row.original);
      return (
        <NetworkGroupChatEditDialog
          groupChatId={row.original.id}
          groupChatName={row.original.name}
          groupChatStatus={row.original.status}
          members={row.original.users ?? []}
          onEdit={() => {
            console.log("Group Chat row.original when editing:", row.original);
          }}
        />
      );
    },
  },
];

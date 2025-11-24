"use client";
import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { CasinoGroupWithCounts } from "@/lib/hooks/swr/casino-group/useCasinoGroup";

export const casinoGroupColumns: ColumnDef<CasinoGroupWithCounts>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Casino Group Name" />
    ),
    cell: ({ row }) => (
      <span className="font-medium capitalize">{row.original.name}</span>
    ),
  },
  {
    accessorKey: "description",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Description" />
    ),
    cell: ({ row }) => (
      <span className="text-muted-foreground text-sm">
        {row.original.description || (
          <span className="italic">No description</span>
        )}
      </span>
    ),
  },
  {
    accessorKey: "_count.users",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Users" />
    ),
    cell: ({ row }) => (
      <span className="font-mono">{row.original._count?.users ?? 0}</span>
    ),
  },
  {
    accessorKey: "_count.groupChats",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="GCs" />
    ),
    cell: ({ row }) => (
      <span className="font-mono">{row.original._count?.groupChats ?? 0}</span>
    ),
  },
  {
    accessorKey: "active",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Active" />
    ),
    cell: ({ row }) => {
      // Default to active=true if not present
      const isActive = row.original.active ?? true;
      return (
        <Badge
          className={`w-fit ${
            isActive
              ? "bg-green-600 hover:bg-green-700 text-white"
              : "bg-red-500 hover:bg-red-600 text-white"
          }`}
        >
          {isActive ? "Yes" : "No"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created At" />
    ),
    cell: ({ row }) => {
      const createdAt = new Date(row.original.createdAt);
      const formattedDate = createdAt.toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
      });
      return <span>{formattedDate}</span>;
    },
  },
];

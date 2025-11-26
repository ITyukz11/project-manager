"use client";
import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTablePagination } from "./data-table-pagination";
import { DataTableToolbar } from "./data-table-toolbar";
import { Checkbox } from "@/components/ui/checkbox"; // Adjust the import according to your file structure
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "../ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { cn } from "@/lib/utils";

export interface DataTableAction<T> {
  label: string;
  icon?: React.ReactNode;
  onClick: (row: T) => void;
  variant?: "default" | "destructive" | "outline" | "ghost";
  isHidden?: boolean;
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  hiddenColumns?: string[];
  onSelectedRowIdsChange?: (selectedRowIds: string[]) => void;
  allowSelectRow?: boolean;
  cursorRowSelect?: boolean;
  setAllowViewRow?: () => void;
  onViewRowId?: (id: string) => void;
  allowDateRange?: boolean;
  allowExportToExcel?: boolean;
  allowExportData?: boolean;
  tableType?: string;
  isLoading?: boolean;
  actions?: DataTableAction<TData>[];
}

export function DataTable<TData extends { id: string }, TValue>({
  columns,
  data,
  hiddenColumns = [],
  onSelectedRowIdsChange,
  allowSelectRow = false,
  cursorRowSelect,
  setAllowViewRow,
  onViewRowId,
  allowDateRange = false,
  allowExportToExcel = false,
  allowExportData = false,
  tableType,
  isLoading = false,
  actions = [],
}: DataTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = React.useState<
    Record<string, boolean>
  >({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>(() => {
      const initialVisibility: VisibilityState = {};
      hiddenColumns.forEach((columnId) => {
        initialVisibility[columnId] = false;
      });
      return initialVisibility;
    });

  React.useEffect(() => {
    const updatedVisibility: VisibilityState = {};
    hiddenColumns.forEach((columnId) => {
      updatedVisibility[columnId] = false;
    });

    setColumnVisibility((prevVisibility) => {
      if (
        JSON.stringify(prevVisibility) !== JSON.stringify(updatedVisibility)
      ) {
        return updatedVisibility;
      }
      return prevVisibility;
    });
  }, [hiddenColumns]);

  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const numberingColumn: ColumnDef<TData, unknown> = {
    id: "#",
    header: "#",
    cell: (info) => info.row.index + 1,
  };

  // Add the "select" column conditionally
  const selectColumn: ColumnDef<TData, unknown> = {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  };

  const handleRowClick = (id: string) => {
    if (onViewRowId) {
      onViewRowId(id);
      // console.log("onViewRowId: ", id)
    }
    if (setAllowViewRow) {
      setAllowViewRow();
      // console.log("setAllowViewRow")
    }
  };

  const columnsWithNumbering = allowSelectRow
    ? [selectColumn, numberingColumn, ...columns]
    : [numberingColumn, ...columns];

  const table = useReactTable({
    data,
    columns: columnsWithNumbering,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
    },
    onColumnVisibilityChange: setColumnVisibility,
    enableRowSelection: allowSelectRow,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  // Using a ref to store the latest value of the callback
  const onSelectedRowIdsChangeRef = React.useRef(onSelectedRowIdsChange);
  onSelectedRowIdsChangeRef.current = onSelectedRowIdsChange;

  React.useEffect(() => {
    if (onSelectedRowIdsChangeRef.current) {
      const selectedRowIds = Object.keys(rowSelection)
        .filter((id) => rowSelection[id])
        .map((rowId) => table.getRow(rowId).getValue("id") as string); // Get the value of the 'id' column for selected rows and assert it as string
      onSelectedRowIdsChangeRef.current(selectedRowIds);
    }
  }, [rowSelection, table]);

  return (
    <div className="space-y-2 flex-wrap py-1 w-full">
      <DataTableToolbar
        data={data}
        table={table}
        selectedRows={rowSelection}
        allowDateRange={allowDateRange}
        allowExportToExcel={allowExportToExcel}
        allowExportData={allowExportData}
        tableType={tableType}
      />
      <div className="rounded-md border grid overflow-auto">
        <div className="min-w-0">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup, index) => (
                <TableRow
                  key={`${headerGroup.id}-${index}`}
                  className="hover:bg-primary/90 bg-primary"
                >
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      colSpan={header.colSpan}
                      className="text-white hover:bg-primary/90 bg-primary dark:text-black"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    {columnsWithNumbering.map((_, j) => (
                      <TableCell key={j} className="text-xs sm:text-sm">
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    onClick={() => handleRowClick(row.original.id)}
                    className={cn(cursorRowSelect && "*:cursor-pointer")}
                  >
                    {row.getVisibleCells().map((cell, index) => {
                      if (cell.column.id === "actions") {
                        return (
                          <TableCell key={cell.id}>
                            <TableActions
                              key={index}
                              row={row}
                              actions={actions}
                            />
                          </TableCell>
                        );
                      }

                      return (
                        <TableCell key={cell.id} className="text-xs sm:text-sm">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columnsWithNumbering.length}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {!isLoading && (
        <DataTablePagination table={table} allowSelectRow={allowSelectRow} />
      )}
    </div>
  );
}

export function TableActions<TData>({
  actions,
  row,
}: {
  actions: DataTableAction<TData>[];
  row: { original: TData };
}) {
  return (
    <TooltipProvider delayDuration={100}>
      <div className="flex items-center gap-1">
        {actions
          .filter((a) => !a.isHidden)
          .map((action, index) => (
            <Tooltip key={index}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-8 w-8 rounded-md hover:bg-muted ${
                    action.variant === "destructive" ? "text-destructive" : ""
                  }`}
                  onClick={() => action.onClick(row.original)}
                >
                  {action.icon}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>{action.label}</p>
              </TooltipContent>
            </Tooltip>
          ))}
      </div>
    </TooltipProvider>
  );
}

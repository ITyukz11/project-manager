import React, { startTransition, useEffect, useState } from "react";
import { Table as TanstackTable } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTableViewOptions } from "./data-table-view-options";
import { Download, SearchIcon } from "lucide-react";
import { DateRangePopover } from "../DateRangePopover";
import { DateRange } from "react-day-picker";
// import ExcelJS from "exceljs"
// import { saveAs } from "file-saver"

interface DataTableToolbarProps<TData> {
  data: TData[];
  table: TanstackTable<TData>;
  selectedRows: Record<string, boolean>;
  allowDateRange: boolean;
  dateRange?: DateRange | undefined; // ✅ current date range
  onDateRangeChange?: (range: DateRange | undefined) => void; // ✅ callback
  allowExportToExcel?: boolean;
  allowExportData?: boolean;
  tableType?: string;
}

export function DataTableToolbar<TData extends Record<string, unknown>>({
  table,
  allowDateRange,
  allowExportData,
  dateRange,
  onDateRangeChange,
}: DataTableToolbarProps<TData>) {
  const [filterInput, setFilterInput] = useState<string>("");

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      table.setGlobalFilter(filterInput || undefined);
    }, 300); // Debounce filter input to avoid rapid API calls or rendering

    return () => clearTimeout(timeoutId);
  }, [filterInput, table]);

  // Export to Excel handler
  // const handleExportData = () => {
  //   startTransition(async () => {
  //     const exportData = table.getFilteredRowModel().rows.map(row => row.original)

  //     const workbook = new ExcelJS.Workbook()
  //     const worksheet = workbook.addWorksheet("Sheet1")

  //     if (exportData.length > 0) {
  //       // Create header row from object keys
  //       worksheet.columns = Object.keys(exportData[0]).map(key => ({
  //         header: key,
  //         key: key
  //         // width: 20 // optional column width
  //       }))

  //       // Add data rows
  //       exportData.forEach(data => worksheet.addRow(data))
  //     }

  //     // Generate XLSX file and trigger download
  //     const buffer = await workbook.xlsx.writeBuffer()
  //     const blob = new Blob([buffer], {
  //       type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  //     })
  //     saveAs(blob, "data-table-export.xlsx")
  //   })
  // }

  return (
    <div className="flex items-center justify-between flex-wrap overflow-x-auto px-1">
      <div className="flex flex-1 items-center gap-2 py-1 flex-wrap justify-start">
        <div className="relative">
          <Input
            placeholder="Filter..."
            value={filterInput}
            onChange={(event) => setFilterInput(event.target.value)}
            className="h-9 w-[150px] lg:w-[250px] pr-6 z-50 text-xs md:text-sm"
          />
          <SearchIcon className="absolute right-2 top-2 h-4 w-4" />
        </div>

        {/* {allowExportData && (
          <Button onClick={() => handleExportData()} variant="outline">
            Download Data <Download className="w-5 h-5 shrink-0" />
          </Button>
        )} */}

        {/* <Button variant="outline" disabled className="cursor-not-allowed">
          <AiOutlinePrinter className="w-5 h-5 shrink-0" />
          <Label className="md:block hidden md:text-xs lg:text-sm">Print</Label>
        </Button> */}
      </div>
      <div className="flex flex-row gap-2 items-center flex-wrap">
        {allowDateRange && (
          <DateRangePopover
            value={dateRange} // ✅ pass current date range
            onChange={onDateRangeChange} // ✅ callback when changed
          />
        )}
        <DataTableViewOptions table={table} />
      </div>
    </div>
  );
}

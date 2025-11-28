import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

// Generic log entry type
export type StatusLogWithUser = {
  id: string;
  [key: string]: any; // allow dynamic status or other fields
  createdAt: string | Date;
  performedBy?: { username?: string; role?: string };
  performedById?: string;
};

/** Default status color mapping, can be overridden via props */
const defaultStatusColors: Record<string, string> = {
  PENDING: "bg-yellow-400 text-black border-yellow-500",
  COMPLETED: "bg-green-600 text-white border-green-700",
  REJECTED: "bg-red-600 text-white border-red-700",
  // Add more statuses as needed
};

export function StatusHistorySheet({
  open,
  onOpenChange,
  data,
  statusField = "action", // or could be "status" for different entity
  statusColors = defaultStatusColors,
  title = "Status Timeline",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: StatusLogWithUser[];
  statusField?: string;
  statusColors?: Record<string, string>;
  title?: string;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        <div className="my-4">
          {Array.isArray(data) && data.length > 0 ? (
            <ol className="space-y-8">
              {data.map((log, idx) => {
                const statusValue = log[statusField] ?? "UNKNOWN";
                const dotColor =
                  statusColors[statusValue] || "bg-gray-400 border-gray-500";
                return (
                  <li
                    key={log.id}
                    className="grid grid-cols-[24px_1fr] gap-4 relative"
                  >
                    {/* Timeline: circle and vertical line */}
                    <div className="relative flex justify-center items-start h-full">
                      {/* The colored circle */}
                      <span
                        className={`relative z-10 w-4 h-4 rounded-full border-2 ${dotColor}`}
                        style={{ marginTop: 2 }}
                      />
                      {idx < data.length - 1 && (
                        <div
                          className="absolute left-1/2 top-5 -translate-x-1/2 w-0.5 bg-muted"
                          style={{ height: "calc(100% - 20px)" }}
                        />
                      )}
                    </div>
                    {/* Timeline info side */}
                    <div className="flex flex-col gap-1">
                      <Badge className={dotColor}>{statusValue}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(log.createdAt), "PPpp")}
                      </span>
                      <div className="text-xs">
                        By:{" "}
                        <span className="font-medium">
                          {log.performedBy?.username ||
                            log.performedById ||
                            "—"}
                        </span>
                        {" - "}
                        <span className="font-thin ">
                          {log.performedBy?.role || log.performedById || "—"}
                        </span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          ) : (
            <div className="text-sm text-muted-foreground">
              No status history yet.
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

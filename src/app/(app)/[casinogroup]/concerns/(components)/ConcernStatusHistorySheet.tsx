import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ConcernLogs, User } from "@prisma/client";

// log.performedBy is expected, not performedById!
type ConcernLogsWithUser = ConcernLogs & { performedBy?: User };

export function ConcernStatusHistorySheet({
  open,
  onOpenChange,
  data,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: ConcernLogsWithUser[];
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Status Timeline</SheetTitle>
        </SheetHeader>
        <div className="my-4">
          {Array.isArray(data) && data.length > 0 ? (
            <ol className="space-y-8">
              {data.map((log, idx) => (
                <li
                  key={log.id}
                  className="grid grid-cols-[24px_1fr] gap-4 relative"
                >
                  {/* Timeline: circle and vertical line */}
                  <div className="relative flex justify-center items-start h-full">
                    {/* The colored circle */}
                    <span
                      className={`relative z-10 w-4 h-4 rounded-full border-2
                        ${
                          log.action === "PENDING"
                            ? "bg-yellow-400 border-yellow-500"
                            : log.action === "COMPLETED"
                            ? "bg-green-600 border-green-700"
                            : "bg-red-600 border-red-700"
                        }
                      `}
                      style={{ marginTop: 2 }}
                    />
                    {/* The vertical line: show except after the last status */}
                    {idx < data.length - 1 && (
                      <div
                        className="absolute left-1/2 top-5 -translate-x-1/2 w-0.5 bg-muted"
                        style={{
                          height: "calc(100% - 20px)", // from center of dot to bottom of li
                        }}
                      />
                    )}
                  </div>
                  {/* Timeline info side */}
                  <div className="flex flex-col gap-1">
                    <Badge
                      className={
                        log.action === "PENDING"
                          ? "bg-yellow-400 text-black"
                          : log.action === "COMPLETED"
                          ? "bg-green-600 text-white"
                          : "bg-red-600 text-white"
                      }
                    >
                      {log.action}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(log.createdAt), "PPpp")}
                    </span>
                    <div className="text-xs">
                      By:{" "}
                      <span className="font-medium">
                        {log.performedBy?.username || log.performedById || "—"}
                      </span>
                      {" - "}
                      <span className="font-thin ">
                        {log.performedBy?.role || log.performedById || "—"}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
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

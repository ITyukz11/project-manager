"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, Clock } from "lucide-react";
import useReadyChecks from "@/lib/hooks/swr/ready-check/useReadyChecks";

type Props = {
  viewRowId?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * ReadyCheckViewDialog
 *
 * Props:
 * - viewRowId: id passed from the table row click handler
 * - open, onOpenChange: control dialog visibility
 *
 * Usage:
 * - Parent DataTable's onViewRowId should set the viewRowId in parent state and set open=true.
 * - This dialog will fetch /api/ready-check/:id and display details.
 */
export function ReadyCheckViewDialog({ viewRowId, open, onOpenChange }: Props) {
  const { readyChecks, error, isValidating } = useReadyChecks({
    readyCheckId: viewRowId || null,
  });
  const readyCheck = readyChecks.length > 0 ? readyChecks[0] : undefined;
  const participants = readyCheck?.participants ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] w-[min(95vw,900px)] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ready Check Details</DialogTitle>
          <DialogDescription>
            {viewRowId ? `Viewing ready check` : "No ready check selected"}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          {isValidating && !readyCheck ? (
            <div className="space-y-4">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : error ? (
            <div className="text-sm text-red-600">
              Failed to load ready check.
            </div>
          ) : !readyCheck ? (
            <div className="text-sm text-muted-foreground">
              No ready-check data.
            </div>
          ) : (
            <>
              {/* Header info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <div>
                  <div className="text-xs text-muted-foreground">
                    Initiated By
                  </div>
                  <div className="font-medium">
                    {readyCheck.initiator?.username ??
                      readyCheck.initiator?.name ??
                      "Unknown"}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground">Started</div>
                  <div className="font-medium">
                    {readyCheck.startedAt
                      ? new Date(readyCheck.startedAt).toLocaleString()
                      : "—"}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground">Ended</div>
                  <div className="font-medium">
                    {readyCheck.endedAt
                      ? new Date(readyCheck.endedAt).toLocaleString()
                      : "—"}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Summary */}
              <div className="flex items-center gap-4 mt-4 mb-4">
                <div>
                  <div className="text-xs text-muted-foreground">
                    Participants
                  </div>
                  <div className="font-medium">
                    {readyCheck.totalParticipants ?? participants.length}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground">
                    Clocked In
                  </div>
                  <div className="font-medium">
                    {readyCheck.totalClockedIn ??
                      participants.filter((p) => p.wasClockedIn).length}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground">Ready</div>
                  <div className="font-medium">
                    {participants.filter((p) => p.responded).length}/
                    {readyCheck.totalParticipants ?? participants.length}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Participant list */}
              <div className="mt-4">
                <div className="text-sm font-medium mb-2">Participants</div>
                <div className="space-y-2 max-h-[40vh] overflow-auto pr-2">
                  {participants.length === 0 ? (
                    <div className="text-sm text-muted-foreground">
                      No participants recorded.
                    </div>
                  ) : (
                    participants.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between rounded-md hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {(p.username ?? p.userId ?? "U").slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="font-medium truncate">
                              {p.username ?? p.userId}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {p.role ?? "—"}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-xs text-muted-foreground text-right">
                            <div>Was Clocked In</div>
                            <div className="font-medium">
                              {p.wasClockedIn ? (
                                <Badge className="bg-green-600 text-white">
                                  <Clock className="mr-1" size={12} />
                                  Yes
                                </Badge>
                              ) : (
                                <Badge className="bg-slate-200 text-muted-foreground">
                                  No
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="text-xs text-muted-foreground text-right">
                            <div>Responded</div>
                            <div className="font-medium">
                              {p.responded ? (
                                <Badge className="bg-green-600 text-white">
                                  <Check className="mr-1" size={12} />
                                  {p.respondedAt
                                    ? new Date(
                                        p.respondedAt
                                      ).toLocaleTimeString()
                                    : "Yes"}
                                </Badge>
                              ) : (
                                <Badge className="bg-slate-200 text-muted-foreground">
                                  No
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="mt-6">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ReadyCheckViewDialog;

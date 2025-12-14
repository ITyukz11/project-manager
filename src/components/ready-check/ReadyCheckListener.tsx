"use client";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { usePusher } from "@/lib/hooks/use-pusher";

/**
 * Shape of payloads that server sends.
 */
type Participant = {
  id: string;
  name: string;
  username?: string;
  role?: string;
};

type StartPayload = {
  id: string;
  initiator: { id: string; name: string; username?: string; role?: string };
  participants: Participant[];
  createdAt: string;
};

type UpdatePayload = {
  id: string;
  userId: string;
  ready: boolean;
  readyCount: number;
  total: number;
  responses: Record<string, boolean>;
};

export function ReadyCheckListener() {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const [open, setOpen] = useState(false);
  const [readyId, setReadyId] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [responses, setResponses] = useState<Record<string, boolean>>({});
  const [initiator, setInitiator] = useState<StartPayload["initiator"] | null>(
    null
  );
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // derived counts
  const total = participants.length;
  const readyCount = useMemo(
    () => Object.values(responses).filter(Boolean).length,
    [responses]
  );

  // When start event arrives, open dialog and initialize state
  const handleStart = useCallback((payload: StartPayload) => {
    setReadyId(payload.id);

    const list = payload.participants.slice();
    // ensure initiator present
    if (!list.some((p) => p.id === payload.initiator.id)) {
      list.unshift({
        id: payload.initiator.id,
        name: payload.initiator.name,
        username: payload.initiator.username,
        role: payload.initiator.role,
      });
    }

    setParticipants(list);
    setResponses(Object.fromEntries(list.map((p) => [p.id, false])));
    setInitiator(payload.initiator);
    setOpen(true);

    // show toast using role (fallback to name if role missing)
    const initiatorLabel = payload.initiator.role ?? payload.initiator.name;
    toast.success(`${initiatorLabel} started a Ready Check`);
  }, []);

  // When update event arrives, update responses and counts
  const handleUpdate = useCallback(
    (payload: UpdatePayload) => {
      if (!payload || payload.id !== readyId) return;
      setResponses(payload.responses);
    },
    [readyId]
  );

  // subscribe to pusher events
  usePusher<StartPayload>({
    channels: ["ready-check"],
    eventName: "ready-check-start",
    onEvent: handleStart,
    audioRef,
  });

  usePusher<UpdatePayload>({
    channels: ["ready-check"],
    eventName: "ready-check-update",
    onEvent: handleUpdate,
    audioRef,
  });

  // send response to server (no-op if no readyId)
  const sendResponse = useCallback(
    async (value: boolean) => {
      if (!readyId) return;
      try {
        const res = await fetch(
          `/api/ready-check/${encodeURIComponent(readyId)}/response`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ready: value }),
          }
        );
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          const msg = body?.error || body?.message || "Failed to set ready";
          toast.error(msg);
          console.error("Ready response error:", res.status, body);
          return;
        }
        const okMsg = body?.message || "Ready status sent";
        toast.success(okMsg);
      } catch (err: any) {
        console.error("Ready response network error:", err);
        toast.error(err?.message || "Failed to set ready");
      }
    },
    [readyId]
  );

  // helper exposed to current user: set ready/unready, optimistic update
  const setMyReady = useCallback(
    (value: boolean) => {
      if (!userId) {
        toast.error("You must be signed in to respond.");
        return;
      }
      // only allow if current user is a participant
      if (!participants.some((p) => p.id === userId)) {
        toast.error("You are not part of this ready check.");
        return;
      }

      // optimistic update
      setResponses((prev) => ({ ...prev, [userId]: value }));
      sendResponse(value);
    },
    [sendResponse, userId, participants]
  );

  // Tight, small card styles: reduce padding, font sizes, allow grid to auto-fill many columns
  const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
    gap: 8,
    marginTop: 12,
  };

  const cardBase =
    "p-2 rounded-md flex flex-col items-start space-y-1 border text-xs";

  // current user's ready state (derived)
  const myReady = useMemo(
    () => (userId ? responses[userId] === true : false),
    [responses, userId]
  );

  const currentUserIsParticipant = useMemo(
    () => (userId ? participants.some((p) => p.id === userId) : false),
    [participants, userId]
  );

  return (
    <>
      <audio ref={audioRef as any} src="/sounds/notify.mp3" preload="auto" />

      <Dialog open={open} onOpenChange={(v) => setOpen(v)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <div className="flex items-center justify-between w-full">
              <div>
                <DialogTitle className="mb-1">Ready Check</DialogTitle>
                <div className="text-sm text-muted-foreground">
                  {readyCount}/{total} ready
                </div>
                {initiator && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Initiated by{" "}
                    <span className="font-medium">
                      {initiator.role ?? initiator.name}
                    </span>
                  </div>
                )}
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <div>Options</div>
                <div className="mt-1">
                  <span className="inline-flex items-center px-2 py-0.5 bg-green-100 text-green-700 rounded text-[11px] mr-1">
                    Ready
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 bg-red-100 text-red-700 rounded text-[11px]">
                    Not ready
                  </span>
                </div>
              </div>
            </div>
          </DialogHeader>

          <div style={gridStyle}>
            {participants.map((p) => {
              const isReady = responses[p.id] === true;
              const isInitiator = initiator?.id === p.id;

              return (
                <div
                  key={p.id}
                  className={`${cardBase} ${
                    isReady
                      ? "bg-green-50 border-green-200"
                      : "bg-red-50 border-red-200"
                  } ${isInitiator ? "ring-1 ring-yellow-300" : ""}`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div>
                      {/* primary: role (fallback to name), secondary: username */}
                      <div
                        className="font-medium truncate"
                        title={p.role ?? p.name}
                      >
                        {p.role ?? p.name}
                      </div>
                      <div className="text-muted-foreground text-[11px] truncate">
                        @{p.username ?? p.id.slice(0, 6)}
                      </div>
                    </div>

                    {/* status dot */}
                    <div
                      className={`w-3 h-3 rounded-full ml-2 ${
                        isReady ? "bg-green-600" : "bg-red-600"
                      }`}
                      title={isReady ? "Ready" : "Not ready"}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <DialogFooter className="mt-4 flex items-center justify-between space-x-2">
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant={myReady ? "secondary" : "default"}
                onClick={() => setMyReady(true)}
                disabled={!currentUserIsParticipant || !readyId}
                aria-pressed={myReady}
              >
                Ready
              </Button>

              <Button
                size="sm"
                variant={!myReady ? "destructive" : "outline"}
                onClick={() => setMyReady(false)}
                disabled={!currentUserIsParticipant || !readyId}
                aria-pressed={!myReady}
              >
                Not ready
              </Button>
            </div>

            <div>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Close
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

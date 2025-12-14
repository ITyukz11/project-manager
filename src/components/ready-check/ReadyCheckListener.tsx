"use client";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
import {
  avoidDefaultDomBehavior,
  handleKeyDown,
} from "@/lib/utils/dialogcontent.utils";
import { format } from "path";
import { formatDate } from "date-fns";

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

  // dialog + ready-check state
  const [open, setOpen] = useState(false);
  const [readyId, setReadyId] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [responses, setResponses] = useState<Record<string, boolean>>({});
  const [initiator, setInitiator] = useState<StartPayload["initiator"] | null>(
    null
  );

  // UI mode: initially show only big buttons + timer.
  // When the current user presses Ready, showDetails becomes true and the participant grid/info is revealed for that user.
  const [showDetails, setShowDetails] = useState(false);

  // timer state
  const TIMER_SECONDS = 30;
  const [secondsLeft, setSecondsLeft] = useState<number>(TIMER_SECONDS);
  const [ended, setEnded] = useState<boolean>(false);
  const timerRef = useRef<number | null>(null);

  // refs to hold latest values inside timer callbacks
  const responsesRef = useRef<Record<string, boolean>>({});

  // audio ref for usePusher
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // derived counts
  const total = participants.length;
  const readyCount = useMemo(
    () => Object.values(responses).filter(Boolean).length,
    [responses]
  );

  useEffect(() => {
    responsesRef.current = responses;
  }, [responses]);

  // schedule showing details asynchronously to avoid synchronous setState inside the effect body
  useEffect(() => {
    if (!userId) return;

    // only open details when user became ready and details are not already shown
    if (responses[userId]) {
      const t = window.setTimeout(() => {
        setShowDetails(true);
      }, 0);
      return () => window.clearTimeout(t);
    }
    // if user un-ready, don't hide details automatically — keep UX stable
    return;
  }, [responses, userId]);

  // start a new ready-check: initialize state + start timer
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

    // reset timer and ended state
    setSecondsLeft(TIMER_SECONDS);
    setEnded(false);
    setShowDetails(false); // start with minimal view again
    setOpen(true);
  }, []);

  // update responses when server broadcasts update
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
    // audioRef,
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
          console.error("Ready response error:", res.status, body);
          toast.error(msg);
          return;
        }
        // success - server broadcasts update
      } catch (err: any) {
        console.error("Ready response network error:", err);
        toast.error(err?.message || "Failed to set ready");
      }
    },
    [readyId]
  );

  // helper exposed to current user: set ready/unready, optimistic update (disabled after end)
  const setMyReady = useCallback(
    (value: boolean) => {
      if (!userId) {
        toast.error("You must be signed in to respond.");
        return;
      }
      if (!participants.some((p) => p.id === userId)) {
        toast.error("You are not part of this ready check.");
        return;
      }
      if (ended) {
        toast.error("Ready check has ended.");
        return;
      }
      // optimistic update
      setResponses((prev) => ({ ...prev, [userId]: value }));
      // Reveal details immediately if user pressed Ready
      if (value) setShowDetails(true);
      sendResponse(value);
    },
    [sendResponse, userId, participants, ended]
  );

  // timer effect: run when dialog opens for a readyId and not already ended
  useEffect(() => {
    // clear previous timer just in case
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (!open || !readyId || ended) return;

    setSecondsLeft(TIMER_SECONDS);
    setEnded(false);

    timerRef.current = window.setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          // time up - clear interval
          if (timerRef.current) {
            window.clearInterval(timerRef.current);
            timerRef.current = null;
          }

          // compute using refs to avoid stale closures
          const latestResponses = responsesRef.current;
          const ready = Object.values(latestResponses).filter(Boolean).length;
          const totalNow = participants.length;

          // mark ended and show result toast
          setEnded(true);
          if (ready === totalNow && totalNow > 0) {
            toast.success(`All ${totalNow} users are ready.`);
          } else {
            toast.info(`Ready check ended: ${ready}/${totalNow} ready`, {
              duration: 10_000,
              description: formatDate(new Date(), "h:mm:aa"),
            });
          }

          return 0;
        }
        return s - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, readyId]); // removed `ended` to avoid unnecessary re-run

  // cleanup on unmount: clear timer
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  // compact grid and card styles
  const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
    gap: 8,
    marginTop: 12,
  };

  const cardBase =
    "p-2 rounded-md flex flex-col items-start space-y-1 border text-xs";

  // derived states
  const myReady = useMemo(
    () => (userId ? responses[userId] === true : false),
    [responses, userId]
  );
  const currentUserIsParticipant = useMemo(
    () => (userId ? participants.some((p) => p.id === userId) : false),
    [participants, userId]
  );

  // results computed after end: arrays of ready / not ready participants (use current responses)
  const readyList = useMemo(
    () => participants.filter((p) => responses[p.id] === true),
    [participants, responses]
  );
  const notReadyList = useMemo(
    () => participants.filter((p) => responses[p.id] !== true),
    [participants, responses]
  );

  // Prevent closing while countdown is active
  const handleDialogOpenChange = useCallback(
    (nextOpen: boolean) => {
      // if they are trying to close and timer not finished => block
      if (!nextOpen && !ended) {
        toast("Please wait until the ready check finishes.");
        return;
      }

      // closing after ended: cleanup state
      if (!nextOpen && ended) {
        // optional: clear state when closing
        setOpen(false);
        setReadyId(null);
        setParticipants([]);
        setResponses({});
        setInitiator(null);
        setSecondsLeft(TIMER_SECONDS);
        setEnded(false);
        setShowDetails(false);
        return;
      }

      // opening allowed
      setOpen(nextOpen);
    },
    [ended]
  );

  return (
    <>
      <audio
        ref={audioRef as any}
        src="/sounds/ready-check.mp3"
        preload="auto"
      />

      <Dialog open={open} onOpenChange={handleDialogOpenChange}>
        <DialogContent
          className="max-w-4xl [&>button]:hidden"
          onPointerDownOutside={avoidDefaultDomBehavior}
          onInteractOutside={avoidDefaultDomBehavior}
          onKeyDown={handleKeyDown}
        >
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
                {/* timer / status */}
                <div className="mt-2">
                  {!ended ? (
                    <div className="text-xs text-muted-foreground">
                      Time left:{" "}
                      <span className="font-medium">{secondsLeft}s</span>
                    </div>
                  ) : (
                    <div className="text-xs font-medium">
                      Ready check finished — {readyCount}/{total} ready
                    </div>
                  )}
                  {/* simple linear progress */}
                  <div className="w-full h-2 bg-border rounded mt-2">
                    <div
                      className={`h-2 rounded ${
                        ended ? "bg-gray-400" : "bg-green-500"
                      }`}
                      style={{
                        width: `${Math.max(
                          0,
                          ((TIMER_SECONDS - secondsLeft) / TIMER_SECONDS) * 100
                        )}%`,
                        transition: "width 500ms linear",
                      }}
                    />
                  </div>
                </div>
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

          {/* Minimal view: big Ready / Not ready buttons + timer only */}
          {!showDetails && !ended && (
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="w-full max-w-md ">
                <Button
                  size="lg"
                  className="w-full h-14 text-lg flex items-center justify-center hover:bg-green-600/80 bg-green-600 dark:bg-green-500"
                  onClick={() => setMyReady(true)}
                  disabled={!currentUserIsParticipant || !readyId}
                  variant={myReady ? "secondary" : "default"}
                >
                  READY
                </Button>
              </div>
              <div className="text-xs text-muted-foreground">
                Not pressing ready will result to being marked as not active.
              </div>
            </div>
          )}

          {/* Details view: participant grid (shown after user pressed Ready) */}
          {(showDetails || ended) && (
            <>
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
                          <div
                            className="font-medium truncate dark:text-black"
                            title={p.username ?? p.name}
                          >
                            {p.username ?? p.name}
                          </div>
                          <div className="text-muted-foreground text-[11px] truncate">
                            @{p.role ?? p.id.slice(0, 6)}
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

              {/* results (shown after timer ends) */}
              {ended && (
                <div className="mt-4">
                  <div className="text-sm font-medium mb-2">Results</div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">
                        Ready ({readyList.length})
                      </div>
                      <div className="space-y-1">
                        {readyList.map((p) => (
                          <div
                            key={p.id}
                            className="flex items-center justify-between text-sm"
                          >
                            <div className="truncate">{p.role ?? p.name}</div>
                            <div className="text-xs text-muted-foreground">
                              @{p.username ?? p.id.slice(0, 6)}
                            </div>
                          </div>
                        ))}
                        {readyList.length === 0 && (
                          <div className="text-xs text-muted-foreground">—</div>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-muted-foreground mb-1">
                        Not ready ({notReadyList.length})
                      </div>
                      <div className="space-y-1">
                        {notReadyList.map((p) => (
                          <div
                            key={p.id}
                            className="flex items-center justify-between text-sm"
                          >
                            <div className="truncate">
                              {p.username ?? p.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              @{p.role ?? p.id.slice(0, 6)}
                            </div>
                          </div>
                        ))}
                        {notReadyList.length === 0 && (
                          <div className="text-xs text-muted-foreground">—</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          <DialogFooter className="mt-4 flex items-center justify-between space-x-2">
            {ended && (
              <div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setOpen(false);
                  }}
                >
                  Close
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

"use client";
import { useRef, useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { handleKeyDown } from "@/lib/utils/dialogcontent.utils";
import { usePusher } from "@/lib/hooks/use-pusher";
import { useSession } from "next-auth/react";
import { Button } from "../ui/button";
import { TriangleAlert } from "lucide-react";

// Helper to stop audio
const stopAudio = (audioRef: React.RefObject<HTMLAudioElement | null>) => {
  if (audioRef.current) {
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
  }
};

// Send "stop alarm" event
async function sendStopAlarm(name: string) {
  await fetch("/api/gateway-alarm-stop", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
}

export function GatewayAlarm() {
  const [open, setOpen] = useState(false);
  const [stoppedBy, setStoppedBy] = useState<string | null>(null);
  const [casinoGroup, setCasinoGroup] = useState<string | null>(null);
  const [info, setInfo] = useState<{
    username?: string;
    amount?: number | string;
    transactionType?: string;
    casinoGroup?: string;
  } | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { data: session } = useSession();

  // Only allow closing dialog for "stopped" state
  const handleDialogOpenChange = useCallback(
    (isOpen: boolean) => {
      if (stoppedBy) {
        setOpen(isOpen);
      } else {
        // Do not allow dismissal when alarming
        setOpen(true);
      }
    },
    [stoppedBy]
  );

  // Only turn off alarm (sound and event) when button pressed!
  const handleTurnOffAlarm = useCallback(() => {
    setOpen(false);
    stopAudio(audioRef);
    if (session?.user?.name) {
      sendStopAlarm(session.user.name);
    }
  }, [session]);

  // Alarm start
  usePusher({
    channels: ["gateway-alarm"],
    eventName: "gateway-alarm-start",
    onEvent: (data) => {
      setInfo(data);
      setStoppedBy(null);
      setCasinoGroup(data?.casinoGroup || null);
      setOpen(true);
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.loop = true;
        audioRef.current.play().catch(() => {});
      }
    },
    audioRef,
  });

  // Alarm stopped (by self or someone else)
  usePusher({
    channels: ["gateway-alarm"],
    eventName: "gateway-alarm-stopped",
    onEvent: (data: { name: string }) => {
      setStoppedBy(data?.name || "Someone");
      setOpen(true);
      stopAudio(audioRef);
    },
    audioRef,
  });

  return (
    <div className="absolute">
      <audio
        ref={audioRef as any}
        src="/sounds/gateway-alarm.mp3"
        preload="auto"
        loop
      />
      <Dialog open={open} onOpenChange={handleDialogOpenChange}>
        <DialogContent
          className={`
            [&>button]:hidden
            max-w-3xl w-[95vw] md:w-[540px]
            border-4 border-red-700 
            shadow-2xl rounded-2xl
            bg-white dark:bg-zinc-900/90
            p-0 overflow-visible!
            flex flex-col items-center justify-center
          `}
          onPointerDownOutside={(e) => {
            if (!stoppedBy) {
              e.preventDefault();
            } else {
              stopAudio(audioRef);
              setOpen(false);
            }
          }}
          onInteractOutside={(e) => {
            if (!stoppedBy) {
              e.preventDefault();
            } else {
              stopAudio(audioRef);
              setOpen(false);
            }
          }}
          onKeyDown={(e) => {
            if (!stoppedBy && e.key === "Escape") {
              e.preventDefault();
            } else if (stoppedBy && e.key === "Escape") {
              stopAudio(audioRef);
              setOpen(false);
            } else {
              handleKeyDown(e);
            }
          }}
        >
          <div
            className="
              flex flex-col items-center p-8
              bg-linear-to-b from-red-700/95 via-red-600/90 to-red-900/90
              dark:from-red-800 dark:to-zinc-900
              rounded-t-2xl
              animate-pulse ring-4 ring-red-500/80
              w-full
              "
          >
            <div className="flex flex-col items-center justify-center gap-3">
              <span
                className="
                  inline-flex items-center justify-center
                  w-20 h-20
                  rounded-full
                  bg-white dark:bg-black
                  border-4 border-red-700
                  shadow-lg shadow-red-900/70
                  mb-2
                  "
              >
                <svg
                  fill="none"
                  viewBox="0 0 48 48"
                  className="w-14 h-14 text-red-700 dark:text-red-400"
                  aria-hidden="true"
                >
                  <circle
                    cx="24"
                    cy="24"
                    r="22"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="none"
                  />
                  <rect
                    x="21"
                    y="11"
                    width="6"
                    height="19"
                    rx="3"
                    fill="currentColor"
                  />
                  <rect
                    x="21"
                    y="34"
                    width="6"
                    height="6"
                    rx="3"
                    fill="currentColor"
                  />
                </svg>
              </span>
              <DialogHeader>
                <DialogTitle className="text-3xl md:text-4xl font-extrabold text-red-100 drop-shadow dark:text-red-200 uppercase tracking-wide mb-1 text-center">
                  GATEWAY&nbsp;ALARM!
                </DialogTitle>
              </DialogHeader>
            </div>
            <div className="text-center mt-3">
              <span className="text-xl text-red-100 font-bold dark:text-red-200 uppercase tracking-wide">
                Attention Required Immediately
              </span>
            </div>
          </div>
          <div className="px-8 pb-8 pt-5 flex flex-col items-center bg-white dark:bg-zinc-900 rounded-b-2xl w-full">
            {stoppedBy ? (
              <div className="text-center text-xl mb-4 text-black dark:text-gray-100">
                <span className="font-bold text-red-600 dark:text-red-400">
                  {stoppedBy}
                </span>{" "}
                has turned off the alarm.
                <br />
                You may now close this alert.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2 text-lg text-black dark:text-gray-100 mb-4 w-full">
                <div>
                  <span className="font-bold text-red-700 dark:text-red-400">
                    {info?.username}
                  </span>{" "}
                  is requesting:
                </div>
                <div>
                  <span className="font-bold text-red-500 dark:text-red-400 capitalize">
                    {info?.transactionType}
                  </span>
                  {info?.amount && (
                    <span>
                      {" "}
                      &ndash;{" "}
                      <span className="font-extrabold text-red-700 dark:text-red-400">
                        ₱{info.amount}
                      </span>
                    </span>
                  )}
                  &ndash;{" "}
                  <span className="font-extrabold text-red-700 dark:text-red-400">
                    ₱{info?.casinoGroup}
                  </span>
                </div>
                <div className="text-base text-gray-600 dark:text-gray-300 mt-2">
                  Please process this request&nbsp;
                  <span className="font-bold text-red-700 dark:text-red-400 uppercase">
                    immediately
                  </span>{" "}
                  to ensure a smooth transaction.
                </div>
              </div>
            )}
            <DialogFooter className="w-full flex justify-center mt-2">
              {!stoppedBy ? (
                <Button
                  className="inline-flex items-center gap-2 px-8 py-3 rounded-lg bg-linear-to-tr from-red-700 to-red-500 text-white font-bold text-lg tracking-wide shadow-lg ring-2 ring-red-800 hover:bg-red-800 focus:outline-none focus:ring-4 focus:ring-red-400 transition"
                  onClick={handleTurnOffAlarm}
                >
                  <TriangleAlert className="w-6 h-6 animate-pulse" />
                  Turn OFF ALARM
                </Button>
              ) : (
                <Button
                  className="inline-flex items-center gap-2 px-7 py-2 rounded-lg bg-gray-400 dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-bold text-base tracking-wide shadow focus:outline-none transition"
                  onClick={() => {
                    setOpen(false);
                    stopAudio(audioRef);
                  }}
                >
                  Close
                </Button>
              )}
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

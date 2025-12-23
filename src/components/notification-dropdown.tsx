"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { usePusher } from "@/lib/hooks/use-pusher";
import { Spinner } from "./ui/spinner";
import { Notifications } from "@prisma/client";
import { useRef } from "react";

export const NotificationDropdown = () => {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const notificationAudioRef = useRef<HTMLAudioElement | null>(null);

  const [notifications, setNotifications] = useState<Notifications[]>([]);
  const [archiveNotifications, setArchiveNotifications] = useState<
    Notifications[]
  >([]);

  const [activeTab, setActiveTab] = useState<"inbox" | "archives">("inbox");
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  const getTimeAgo = (date?: Date) => {
    if (!date) return "Unknown";
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) return "Unknown";
    return formatDistanceToNow(parsedDate, { addSuffix: true });
  };

  useEffect(() => {
    if (!userId) return;

    // Fetch notifications for the current user
    const fetchNotifications = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/notifications?userId=${userId}`);
        const data = await res.json();

        setNotifications(
          data.notifications?.filter((n: Notifications) => !n.isRead) || []
        );
        setArchiveNotifications(
          data.notifications?.filter((n: Notifications) => n.isRead) || []
        );
      } catch (e) {
        console.error("Failed to fetch notifications", e);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [userId]);

  // Real-time Pusher updates for tagged concerns
  usePusher({
    channels: userId ? [`user-notify-${userId}`] : [],
    eventName: "notifications-event",
    onEvent: (newNotification: Notifications) => {
      let isNew = false;

      if (newNotification.isRead) {
        setArchiveNotifications((prev) => {
          const alreadyExists = prev.some((n) => n.id === newNotification.id);
          if (!alreadyExists) isNew = true;
          return alreadyExists ? prev : [newNotification, ...prev];
        });
      } else {
        setNotifications((prev) => {
          const alreadyExists = prev.some((n) => n.id === newNotification.id);
          if (!alreadyExists) isNew = true;
          return alreadyExists ? prev : [newNotification, ...prev];
        });
      }
    },
    audioRef: notificationAudioRef,
  });

  // Mark a single notification as read and move to archive
  const markAsRead = async (notificationId: string, link?: string | null) => {
    try {
      await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId, userId }),
      });
      setNotifications((prev) => {
        const notif = prev.find((n) => n.id === notificationId);
        if (!notif) return prev;
        setArchiveNotifications((arch) => {
          // Remove any existing item with the same id first
          const archNoDup = arch.filter((n) => n.id !== notificationId);
          return [{ ...notif, isRead: true }, ...archNoDup];
        });
        return prev.filter((n) => n.id !== notificationId);
      });

      if (link) {
        if (pathname === link) {
          // Already on the route, so just reload the page
          router.refresh(); // For Next.js App Router
          // router.reload(); // For Pages Router
        } else {
          router.push(link);
        }
      }
    } catch (e) {
      console.error("Failed to mark as read", e);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size={"sm"} variant={"outline"} className="relative">
            <Bell className="w-4 h-4" />
            {notifications.length > 0 && (
              <div className="z-50 absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {notifications.length}
              </div>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[380px] mr-10 p-0 shadow-lg overflow-hidden bg-white dark:bg-neutral-900 border">
          {/* Tabs */}
          <div className="flex border-b  px-4">
            <button
              className={`cursor-pointer flex-1 py-2 text-sm font-semibold transition-colors ${
                activeTab === "inbox"
                  ? "border-b-2 border-black dark:border-white text-black dark:text-white"
                  : "text-gray-500 hover:text-black dark:hover:text-gray-400"
              }`}
              onClick={() => setActiveTab("inbox")}
            >
              Inbox
              {notifications.length > 0 && (
                <span className="ml-2 bg-red-500 text-white rounded-full px-2 text-xs font-bold">
                  {notifications.length}
                </span>
              )}
            </button>
            <button
              className={`cursor-pointer flex-1 py-2 text-sm font-semibold transition-colors ${
                activeTab === "archives"
                  ? "border-b-2 border-black dark:border-white text-black dark:text-white"
                  : "text-gray-500 hover:text-black dark:hover:text-gray-400"
              }`}
              onClick={() => setActiveTab("archives")}
            >
              Archives
              {archiveNotifications.length > 0 && (
                <span className="ml-2 bg-gray-300 dark:bg-gray-700 text-black dark:text-white rounded-full px-2 text-xs font-bold">
                  {archiveNotifications.length}
                </span>
              )}
            </button>
          </div>
          {/* Notifications list */}
          <DropdownMenuGroup className="max-h-80 overflow-y-auto bg-white dark:bg-neutral-900 px-2">
            {loading ? (
              <Spinner />
            ) : (activeTab === "inbox" ? notifications : archiveNotifications)
                .length === 0 ? (
              <div className="p-6 text-sm text-gray-500 dark:text-gray-400 text-center">
                No{" "}
                {activeTab === "inbox"
                  ? "unread"
                  : activeTab === "archives"
                  ? "archived"
                  : "commented"}{" "}
                notifications.
              </div>
            ) : (
              (activeTab === "inbox"
                ? notifications
                : archiveNotifications
              ).map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className={`flex justify-between items-start gap-2 py-3 px-2 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-muted/50`}
                  onClick={
                    activeTab === "inbox"
                      ? () => markAsRead(notification.id, notification.link)
                      : undefined
                  }
                >
                  <div className="flex-1">
                    <p
                      className={`text-sm ${
                        !notification.isRead
                          ? "font-semibold text-black dark:text-white"
                          : "text-gray-800 dark:text-gray-200"
                      }`}
                    >
                      {notification.actor && notification.subject ? (
                        <>
                          <span className="font-bold">
                            {notification.actor}
                          </span>
                          {notification.type === "concerns" && (
                            <>
                              <span> tagged you in Concerns </span>
                              <span className="font-bold">
                                &quot;{notification.subject}&quot;
                              </span>
                            </>
                          )}
                          {notification.type === "cashout" && (
                            <>
                              <span> requested a Cashout: </span>
                              <span className="font-bold">
                                &quot;{notification.subject}&quot;
                              </span>
                            </>
                          )}
                          {notification.type === "tasks" && (
                            <>
                              <span> assigned you a Task: </span>
                              <span className="font-bold">
                                &quot;{notification.subject}&quot;
                              </span>
                            </>
                          )}
                          {notification.type === "remittance" && (
                            <>
                              <span> initiated a Remittance: </span>
                              <span className="font-bold">
                                &quot;{notification.subject}&quot;
                              </span>
                            </>
                          )}
                          {notification.type === "transaction-request" && (
                            <>
                              <span> requested</span>
                              <span className="font-bold">
                                {" "}
                                {" " + notification.subject + " "}
                              </span>
                            </>
                          )}
                          {/* If a casino group exists, add it */}
                          {notification.casinoGroup && (
                            <>
                              <span> in </span>
                              <span className="font-bold">
                                {notification.casinoGroup}
                              </span>
                            </>
                          )}
                          .
                        </>
                      ) : (
                        <>{notification.message}</>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground dark:text-gray-400">
                      {getTimeAgo(notification.createdAt)}
                    </p>
                  </div>
                  {!notification.isRead && activeTab === "inbox" && (
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-1" />
                  )}
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuGroup>
          <Link href="/notifications">
            <Button
              className="w-full mt-2 border-0 border-t rounded-none bg-white dark:bg-neutral-900 text-black dark:text-white"
              variant="outline"
            >
              See all notifications
            </Button>
          </Link>
        </DropdownMenuContent>
      </DropdownMenu>
      <audio
        ref={notificationAudioRef}
        src="/sounds/notif2.wav"
        preload="auto"
      />
    </>
  );
};

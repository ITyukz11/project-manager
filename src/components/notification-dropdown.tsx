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
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { usePusher } from "@/lib/hooks/use-pusher";
import { Spinner } from "./ui/spinner";
import { Notifications } from "@prisma/client";

export const NotificationDropdown = () => {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const notificationAudioRef = useRef<HTMLAudioElement | null>(null);

  const notificationChannel = useMemo(
    () => (userId ? [`user-notify-${userId}`] : []),
    [userId]
  );

  const [inbox, setInbox] = useState<Notifications[]>([]);
  const [comments, setComments] = useState<Notifications[]>([]);
  const [archives, setArchives] = useState<Notifications[]>([]);

  const [activeTab, setActiveTab] = useState<"inbox" | "comments" | "archives">(
    "inbox"
  );
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  const getTimeAgo = (date?: Date) => {
    if (!date) return "Unknown";
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) return "Unknown";
    return formatDistanceToNow(parsedDate, { addSuffix: true });
  };

  // Fetch notifications
  useEffect(() => {
    if (!userId) return;

    const fetchNotifications = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/notifications?userId=${userId}`);
        const data = await res.json();

        const allUnread: Notifications[] =
          data.notifications?.filter((n: Notifications) => !n.isRead) || [];

        setComments(
          allUnread.filter((n) => n.type === "mention" || n.type === "comment")
        );
        setInbox(
          allUnread.filter((n) => n.type !== "mention" && n.type !== "comment")
        );
        setArchives(
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

  const handleNotification = useCallback((newNotification: Notifications) => {
    if (newNotification.isRead) {
      // Move to archives
      setArchives((prev) => {
        const exists = prev.some((n) => n.id === newNotification.id);
        return exists ? prev : [newNotification, ...prev];
      });
      setInbox((prev) => prev.filter((n) => n.id !== newNotification.id));
      setComments((prev) => prev.filter((n) => n.id !== newNotification.id));
    } else {
      // Unread: push to correct tab
      if (
        newNotification.type === "comment" ||
        newNotification.type === "mention"
      ) {
        setComments((prev) => {
          const exists = prev.some((n) => n.id === newNotification.id);
          return exists ? prev : [newNotification, ...prev];
        });
      } else {
        setInbox((prev) => {
          const exists = prev.some((n) => n.id === newNotification.id);
          return exists ? prev : [newNotification, ...prev];
        });
      }
    }
  }, []);

  // Real-time updates
  usePusher({
    channels: notificationChannel,
    eventName: "notifications-event",
    onEvent: handleNotification,
    audioRef: notificationAudioRef,
  });

  // Inside NotificationDropdown component
  const markAllAsRead = async () => {
    if (!userId) return;
    try {
      await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }), // No notificationId => mark all
      });

      // Move all inbox and comments to archives
      setArchives((prev) => [...inbox, ...comments, ...prev]);
      setInbox([]);
      setComments([]);
    } catch (e) {
      console.error("Failed to mark all as read", e);
    }
  };

  // Mark as read
  const markAsRead = async (notificationId: string, link?: string | null) => {
    try {
      await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId, userId }),
      });

      // Move to archives
      const moveToArchives = (arr: Notifications[], setArr: any) => {
        const notif = arr.find((n) => n.id === notificationId);
        if (!notif) return;
        setArr((prev: Notifications[]) =>
          prev.filter((n) => n.id !== notificationId)
        );
        setArchives((prev) => [{ ...notif, isRead: true }, ...prev]);
      };

      moveToArchives(inbox, setInbox);
      moveToArchives(comments, setComments);

      if (link) {
        if (pathname === link) router.refresh();
        else router.push(link);
      }
    } catch (e) {
      console.error("Failed to mark as read", e);
    }
  };

  const renderNotificationMessage = (notification: Notifications) => {
    if (notification.actor && notification.subject) {
      const actor = <span className="font-bold">{notification.actor}</span>;
      const subject = (
        <span className="font-bold">&quot;{notification.subject}&quot;</span>
      );
      const casinoGroup = notification.casinoGroup ? (
        <>
          <span> in </span>
          <span className="font-bold">{notification.casinoGroup}</span>
        </>
      ) : null;

      switch (notification.type) {
        case "comment":
          return (
            <>
              {actor} commented on {subject}
              {casinoGroup}.
            </>
          );
        case "concern":
        case "concerns":
          return (
            <>
              {actor} tagged you in Concerns {subject}
              {casinoGroup}.
            </>
          );
        case "cashout":
          return (
            <>
              {actor} requested a Cashout: {subject}
              {casinoGroup}.
            </>
          );
        case "task":
        case "tasks":
          return (
            <>
              {actor} assigned you a Task: {subject}
              {casinoGroup}.
            </>
          );
        case "remittance":
          return (
            <>
              {actor} initiated a Remittance: {subject}
              {casinoGroup}.
            </>
          );
        case "transaction-request":
          return (
            <>
              {actor} requested {subject}
              {casinoGroup}.
            </>
          );
        case "mention":
          return (
            <>
              {actor} mentioned you in {subject}
              {casinoGroup}.
            </>
          );
        default:
          return <>{notification.message}</>;
      }
    }
    return <>{notification.message}</>;
  };

  const currentList =
    activeTab === "inbox"
      ? inbox
      : activeTab === "comments"
      ? comments
      : archives;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size={"sm"} variant={"outline"} className="relative">
            <Bell className="w-4 h-4" />
            {inbox.length + comments.length > 0 && (
              <div className="z-50 absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {inbox.length + comments.length}
              </div>
            )}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-[380px] mr-10 p-0 shadow-lg overflow-hidden bg-white dark:bg-neutral-900 border">
          {/* Tabs */}
          <div className="flex border-b px-4">
            <button
              className={`cursor-pointer flex-1 py-2 text-sm font-semibold transition-colors ${
                activeTab === "inbox"
                  ? "border-b-2 border-black dark:border-white text-black dark:text-white"
                  : "text-gray-500 hover:text-black dark:hover:text-gray-400"
              }`}
              onClick={() => setActiveTab("inbox")}
            >
              Inbox
              {inbox.length > 0 && (
                <span className="ml-2 bg-red-500 text-white rounded-full px-2 text-xs font-bold">
                  {inbox.length}
                </span>
              )}
            </button>
            <button
              className={`cursor-pointer flex-1 py-2 text-sm font-semibold transition-colors ${
                activeTab === "comments"
                  ? "border-b-2 border-black dark:border-white text-black dark:text-white"
                  : "text-gray-500 hover:text-black dark:hover:text-gray-400"
              }`}
              onClick={() => setActiveTab("comments")}
            >
              Comments
              {comments.length > 0 && (
                <span className="ml-2 bg-gray-300 dark:bg-gray-700 text-black dark:text-white rounded-full px-2 text-xs font-bold">
                  {comments.length}
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
              {archives.length > 0 && (
                <span className="ml-2 bg-gray-300 dark:bg-gray-700 text-black dark:text-white rounded-full px-2 text-xs font-bold">
                  {archives.length}
                </span>
              )}
            </button>
          </div>

          {/* Notifications list */}
          <DropdownMenuGroup className="max-h-80 overflow-y-auto bg-white dark:bg-neutral-900 px-2">
            {loading ? (
              <Spinner />
            ) : currentList.length === 0 ? (
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
              currentList.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className="flex justify-between items-start gap-2 py-3 px-2 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-muted/50"
                  onClick={
                    activeTab !== "archives"
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
                      {renderNotificationMessage(notification)}
                    </p>
                    <p className="text-xs text-muted-foreground dark:text-gray-400">
                      {getTimeAgo(notification.createdAt)}
                    </p>
                  </div>
                  {!notification.isRead && activeTab !== "archives" && (
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-1" />
                  )}
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuGroup>

          <div className="flex  bg-white dark:bg-neutral-900">
            <Link href="/notifications" className="flex-1">
              <Button className="w-full rounded-none " variant="outline">
                See all notifications
              </Button>
            </Link>
            <Button
              className="flex-1 rounded-none"
              variant="outline"
              onClick={markAllAsRead}
              disabled={inbox.length + comments.length === 0}
            >
              Mark all as Read
            </Button>
          </div>
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

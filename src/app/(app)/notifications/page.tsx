"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { formatDistanceToNow } from "date-fns";
import { CardContent, CardHeader, CardTitle, Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Pagination
const PAGE_SIZE = 10;

type Notification = {
  id: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  link?: string;
};

export default function NotificationsPage() {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Search/filter state
  const [search, setSearch] = useState<string>("");
  const [status, setStatus] = useState<"all" | "read" | "unread">("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!userId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    fetch(`/api/notifications?userId=${userId}`)
      .then((res) => res.json())
      .then((data) => {
        setNotifications(data.notifications || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [userId]);

  // Ensure page resets when filters/search change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1);
  }, [search, status]);

  const filteredNotifications = useMemo(() => {
    return notifications.filter((notif) => {
      const matchSearch = notif.message
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchStatus =
        status === "all"
          ? true
          : status === "read"
          ? notif.isRead
          : !notif.isRead;
      return matchSearch && matchStatus;
    });
  }, [notifications, search, status]);

  const totalPages = Math.ceil(filteredNotifications.length / PAGE_SIZE);

  const paginatedNotifications = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredNotifications.slice(start, start + PAGE_SIZE);
  }, [filteredNotifications, page]);

  // Responsive: overflow-x for table, stack filters on mobile, card padding
  // Alternate row backgrounds: use odd:bg-muted/50 even:bg-background for light, odd:bg-muted/30 even:bg-background for dark
  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Search and status filter */}
        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-end mb-4">
          <Input
            placeholder="Search notifications..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs w-full"
          />
          <Select
            value={status}
            onValueChange={(v) => setStatus(v as typeof status)}
          >
            <SelectTrigger className="w-full sm:w-fit" value={status}>
              {status === "all" ? "All" : status === "read" ? "Read" : "Unread"}
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="read">Read</SelectItem>
              <SelectItem value="unread">Unread</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {loading ? (
          <div className="rounded-md border grid overflow-auto">
            <div className="min-w-0">
              <Table className="min-w-[700px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="p-3">
                      <Skeleton className="h-4 w-8" />
                    </TableHead>
                    <TableHead className="p-3">
                      <Skeleton className="h-4 w-32" />
                    </TableHead>
                    <TableHead className="p-3">
                      <Skeleton className="h-4 w-16" />
                    </TableHead>
                    <TableHead className="p-3">
                      <Skeleton className="h-4 w-20" />
                    </TableHead>
                    <TableHead className="p-3">
                      <Skeleton className="h-4 w-12" />
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...Array(10)].map((_, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="p-3">
                        <Skeleton className="h-4 w-8" />
                      </TableCell>
                      <TableCell className="p-3">
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell className="p-3">
                        <Skeleton className="h-4 w-16" />
                      </TableCell>
                      <TableCell className="p-3">
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell className="p-3">
                        <Skeleton className="h-4 w-12" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="text-muted-foreground text-center mt-6">
            No notifications found.
          </div>
        ) : (
          <>
            <div className="rounded-md border grid overflow-auto">
              <div className="min-w-0">
                <Table className="min-w-[700px]">
                  <TableHeader>
                    <TableRow className="hover:bg-primary/90 bg-primary">
                      <TableHead className="text-white hover:bg-primary/90 bg-primary dark:text-black">
                        #
                      </TableHead>
                      <TableHead className="text-white hover:bg-primary/90 bg-primary dark:text-black">
                        Message
                      </TableHead>
                      <TableHead className="text-white hover:bg-primary/90 bg-primary dark:text-black">
                        Status
                      </TableHead>
                      <TableHead className="text-white hover:bg-primary/90 bg-primary dark:text-black">
                        Date
                      </TableHead>
                      <TableHead className="text-white hover:bg-primary/90 bg-primary dark:text-black">
                        Action
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedNotifications.map((notif, idx) => (
                      <TableRow key={notif.id}>
                        <TableCell className="font-mono">
                          {(page - 1) * PAGE_SIZE + idx + 1}
                        </TableCell>
                        <TableCell className="wrap-break-word max-w-xs">
                          {notif.message}
                        </TableCell>
                        <TableCell>
                          {notif.isRead ? (
                            <span className="text-green-600 font-semibold">
                              Read
                            </span>
                          ) : (
                            <span className="text-yellow-600 font-semibold">
                              Unread
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {formatDistanceToNow(new Date(notif.createdAt), {
                            addSuffix: true,
                          })}
                        </TableCell>
                        <TableCell>
                          {notif.link ? (
                            <Link href={notif.link}>
                              <Button size="sm" variant="outline">
                                View
                              </Button>
                            </Link>
                          ) : (
                            <span className="text-muted-foreground">
                              No link
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
            {/* Pagination controls */}
            <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-2">
              <span className="text-sm">
                Page {page} of {totalPages || 1}
              </span>
              <div className="space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages || totalPages === 0}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment, useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ModeToggle } from "../mode-toggle";
import { Button } from "../ui/button";
import { Kbd } from "../ui/kbd";
import { Separator } from "../ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  CheckSquare,
  Clock,
  Clock3,
  Clock8,
  Search as SearchIcon,
  MoreVertical,
} from "lucide-react";
import { NotificationDropdown } from "../notification-dropdown";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { usePusher } from "@/lib/hooks/use-pusher";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ADMINROLES } from "@/lib/types/role";
import { Skeleton } from "../ui/skeleton";
import { ReadyCheckTimerDialog } from "../ReadyCheckTimerDialog";

type Crumb = {
  href: string;
  segment: string;
  labelDefault: string;
};

export type CrumbResolver = (
  segment: string,
  href: string,
  signal?: AbortSignal
) => string | Promise<string | undefined> | undefined;

function prettifySegment(seg: string) {
  const decoded = decodeURIComponent(seg);
  if (/^[0-9a-fA-F-]{8,}$/.test(seg) || /^[0-9]+$/.test(seg)) return decoded;
  return decoded
    .replace(/[-_]+/g, " ")
    .split(" ")
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(" ");
}

function getBreadcrumbs(pathname: string): Crumb[] {
  const path = !pathname
    ? "/"
    : pathname === "/"
    ? "/"
    : pathname.replace(/\/$/, "");
  if (path === "/") return [{ href: "/", segment: "", labelDefault: "Home" }];

  const segments = path.split("/").filter(Boolean);
  const crumbs: Crumb[] = [];
  let accumulated = "";
  segments.forEach((seg) => {
    accumulated += `/${seg}`;
    crumbs.push({
      href: accumulated,
      segment: decodeURIComponent(seg),
      labelDefault: prettifySegment(seg),
    });
  });

  return [{ href: "/", segment: "", labelDefault: "Home" }, ...crumbs];
}

export const AppHeader = ({
  openSearch,
  resolveCrumb,
}: {
  openSearch: () => void;
  resolveCrumb?: CrumbResolver;
}) => {
  const pathname = usePathname() || "/";
  const crumbs = useMemo(() => getBreadcrumbs(pathname), [pathname]);
  const [readyCheckOpen, setReadyCheckOpen] = useState(false);
  const { data: session } = useSession();

  // map href -> resolved label
  const [labels, setLabels] = useState<Record<string, string>>({});

  // Clock state — authoritative value fetched from DB
  const [isClockedIn, setIsClockedIn] = useState<boolean>(false);
  const [clockLoading, setClockLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<"idle" | "in" | "out">(
    "idle"
  );

  // Fetch authoritative attendance status from the DB on mount / when user changes
  useEffect(() => {
    let mounted = true;
    setClockLoading(true);
    if (!session?.user?.id) {
      setIsClockedIn(false);
      setClockLoading(false);
      return;
    }

    (async () => {
      try {
        const res = await fetch("/api/attendance/status");
        if (!mounted) return;
        if (!res.ok) {
          setClockLoading(false);
          return;
        }
        const body = await res.json();
        setIsClockedIn(Boolean(body?.isClockedIn));
        setClockLoading(false);
      } catch {
        setClockLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [session?.user?.id]);

  // Listen for attendance events via pusher
  usePusher<{ userId: string; clockedIn: boolean }>({
    channels: ["attendance"],
    eventName: "user-clocked-in",
    onEvent: (payload) => {
      if (!session?.user?.id) return;
      if (payload.userId === session.user.id) {
        setIsClockedIn(true);
      }
    },
  });

  usePusher<{ userId: string; clockedIn: boolean }>({
    channels: ["attendance"],
    eventName: "user-clocked-out",
    onEvent: (payload) => {
      if (!session?.user?.id) return;
      if (payload.userId === session.user.id) {
        setIsClockedIn(false);
      }
    },
  });

  // handlers
  async function handleAction(action: "clock-in" | "clock-out") {
    if (!session?.user?.id) {
      toast.error("You must be signed in to clock in/out.");
      return;
    }
    // prevent invalid actions
    if (action === "clock-in" && isClockedIn) return;
    if (action === "clock-out" && !isClockedIn) return;

    setActionLoading(action === "clock-in" ? "in" : "out");
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          body?.error || body?.message || "Failed to update attendance";
        throw new Error(msg);
      }

      const newState =
        typeof body?.user?.isClockedIn === "boolean"
          ? Boolean(body.user.isClockedIn)
          : action === "clock-in";

      setIsClockedIn(newState);
      toast.success(action === "clock-in" ? "Clocked in" : "Clocked out");
    } catch (err: any) {
      toast.error(err?.message || "Error updating attendance");
    } finally {
      setActionLoading("idle");
    }
  }

  useEffect(() => {
    let mounted = true;
    const ac = new AbortController();

    (async () => {
      try {
        const resolvedPairs = await Promise.all(
          crumbs.map(async (c) => {
            if (!resolveCrumb) return [c.href, c.labelDefault] as const;
            try {
              const r = await resolveCrumb(c.segment, c.href, ac.signal);
              return [c.href, r ?? c.labelDefault] as const;
            } catch {
              return [c.href, c.labelDefault] as const;
            }
          })
        );
        if (!mounted) return;
        setLabels(Object.fromEntries(resolvedPairs));
      } catch {
        if (mounted) {
          const defaults = Object.fromEntries(
            crumbs.map((c) => [c.href, c.labelDefault])
          );
          setLabels(defaults);
        }
      }
    })();

    return () => {
      mounted = false;
      ac.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [crumbs, pathname, resolveCrumb]);

  const lastLabel =
    labels[crumbs[crumbs.length - 1].href] ??
    crumbs[crumbs.length - 1].labelDefault;

  const isAdmin =
    session?.user?.role === ADMINROLES.SUPERADMIN ||
    session?.user?.role === ADMINROLES.ADMIN;

  return (
    <header
      className={clsx(
        "sticky top-0 z-50 border-b bg-card border-border/80 overflow-hidden"
      )}
    >
      <nav className="px-2 sm:px-4 lg:pr-8 flex h-14 w-full items-center gap-2">
        <SidebarTrigger className="p-0 shrink-0" />
        <Separator orientation="vertical" className="h-6" />

        {/* Desktop Breadcrumbs */}
        <div className="hidden xl:block min-w-0 flex-1">
          <Breadcrumb className="text-sm text-muted-foreground">
            <BreadcrumbList>
              {crumbs.map((c, i) => {
                const isLast = i === crumbs.length - 1;
                const label = labels[c.href] ?? c.labelDefault;
                return (
                  <Fragment key={c.href}>
                    <BreadcrumbItem>
                      {!isLast ? (
                        <BreadcrumbLink asChild>
                          <Link href={c.href} className="hover:text-foreground">
                            {label}
                          </Link>
                        </BreadcrumbLink>
                      ) : (
                        <span className="font-medium text-foreground">
                          {label}
                        </span>
                      )}
                    </BreadcrumbItem>

                    {i !== crumbs.length - 1 && <BreadcrumbSeparator />}
                  </Fragment>
                );
              })}
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Mobile/Tablet Page Title */}
        <div className="xl:hidden flex items-center min-w-0 flex-1">
          <span className="text-sm font-medium text-foreground truncate">
            {lastLabel}
          </span>
        </div>

        {/* Desktop Actions */}
        <div className="hidden lg:flex items-center gap-2 ml-auto shrink-0">
          {/* Clock status + dropdown button */}
          {clockLoading ? (
            <Skeleton className="h-9 w-28 rounded-md" />
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  className={clsx(
                    "flex items-center gap-2",
                    isClockedIn
                      ? "bg-green-600 hover:bg-green-700 text-white"
                      : "bg-red-600 hover:bg-red-700 text-white"
                  )}
                  aria-label="Attendance options"
                >
                  <Clock className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {isClockedIn
                      ? "Clocked In"
                      : "Your are currently Clocked Out"}
                  </span>
                  {/* Pulsing dot indicator */}
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span
                      className={clsx(
                        "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                        isClockedIn ? "bg-green-300" : "bg-red-300"
                      )}
                    ></span>
                    <span
                      className={clsx(
                        "relative inline-flex rounded-full h-2 w-2",
                        isClockedIn ? "bg-green-100" : "bg-red-100"
                      )}
                    ></span>
                  </span>
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                side="bottom"
                align="end"
                className="min-w-[180px]"
              >
                <div className="p-2">
                  <div className="text-xs text-muted-foreground mb-2">
                    Attendance
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleAction("clock-in")}
                      disabled={isClockedIn || actionLoading !== "idle"}
                      className="w-full bg-green-600 hover:bg-green-700 justify-start"
                      aria-disabled={isClockedIn || actionLoading !== "idle"}
                    >
                      <Clock8 className="h-4 w-4 mr-2" /> Clock In
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => handleAction("clock-out")}
                      disabled={!isClockedIn || actionLoading !== "idle"}
                      className="w-full bg-red-600 hover:bg-red-700 justify-start"
                      aria-disabled={!isClockedIn || actionLoading !== "idle"}
                    >
                      <Clock3 className="h-4 w-4 mr-2" /> Clock Out
                    </Button>
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setReadyCheckOpen(true)}
              className="gap-2"
            >
              Ready Check <CheckSquare className="h-4 w-4" />
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={openSearch}
            className="gap-2"
          >
            Search
            <Kbd className="hidden xl:inline-flex ml-1">Ctrl</Kbd>
            <Kbd className="hidden xl:inline-flex ml-1">K</Kbd>
          </Button>

          <NotificationDropdown />
          <ModeToggle />
        </div>

        {/* Mobile/Tablet Actions - Compact */}
        <div className="flex lg:hidden items-center gap-1 ml-auto shrink-0">
          {/* Clock Status Indicator (mobile) */}
          {!clockLoading && (
            <div
              className={clsx(
                "h-2 w-2 rounded-full shrink-0",
                isClockedIn ? "bg-green-500" : "bg-red-500"
              )}
              title={isClockedIn ? "Clocked In" : "Clocked Out"}
            />
          )}

          {/* More Menu for Mobile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0"
                aria-label="More options"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-48">
              {/* Clock In/Out */}
              <div className="p-2">
                <div className="text-xs text-muted-foreground mb-2">
                  Attendance
                </div>
                <div className="flex flex-col gap-1">
                  <DropdownMenuItem
                    onClick={() => handleAction("clock-in")}
                    disabled={
                      isClockedIn || actionLoading !== "idle" || clockLoading
                    }
                    className="cursor-pointer"
                  >
                    <Clock8 className="h-4 w-4 mr-2" />
                    Clock In
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => handleAction("clock-out")}
                    disabled={
                      !isClockedIn || actionLoading !== "idle" || clockLoading
                    }
                    className="cursor-pointer"
                  >
                    <Clock3 className="h-4 w-4 mr-2" />
                    Clock Out
                  </DropdownMenuItem>
                </div>
              </div>

              <DropdownMenuSeparator />

              {/* Search */}
              <DropdownMenuItem onClick={openSearch} className="cursor-pointer">
                <SearchIcon className="h-4 w-4 mr-2" />
                Search
              </DropdownMenuItem>

              {/* Ready Check (Admin only) */}
              {isAdmin && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setReadyCheckOpen(true)}
                    className="cursor-pointer"
                  >
                    <CheckSquare className="h-4 w-4 mr-2" />
                    Ready Check
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <NotificationDropdown />
          <ModeToggle />
        </div>
      </nav>

      <ReadyCheckTimerDialog
        open={readyCheckOpen}
        onOpenChange={setReadyCheckOpen}
      />
    </header>
  );
};

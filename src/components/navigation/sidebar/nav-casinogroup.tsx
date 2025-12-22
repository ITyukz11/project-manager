"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeftRight,
  BanknoteArrowUp,
  CheckSquare,
  ChevronRight,
  ClipboardList,
  MessageCircle,
  Share2,
  Users,
  Wallet,
} from "lucide-react";
import {
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { usePusher } from "@/lib/hooks/use-pusher";
import { Badge } from "@/components/ui/badge";
import { usePendingCounts } from "@/lib/hooks/swr/casino-group/usePendingCounts";
import { Skeleton } from "@/components/ui/skeleton";
import { cva } from "class-variance-authority";

interface MenuLink {
  href: string;
  text: string;
  icon: React.ComponentType;
  disable: boolean;
  pendingCount?: number;
}

export default function NavCasinoGroup({
  casinoGroup,
  casinoGroupIndex,
  className,
}: {
  casinoGroup: { id: string; name: string };
  casinoGroupIndex: number;
  className?: string;
}) {
  const pathname = usePathname();

  // ✅ Single SWR call for all counts!
  const { counts, isLoading } = usePendingCounts(casinoGroup.name);

  // Local state for real-time updates
  const [pendingTransaction, setPendingTransaction] = React.useState(0);
  const [pendingCashouts, setPendingCashouts] = React.useState(0);
  const [pendingConcerns, setPendingConcerns] = React.useState(0);
  const [pendingRemittances, setPendingRemittances] = React.useState(0);
  const [pendingTasks, setPendingTasks] = React.useState(0);

  const casinoGroupLower = React.useMemo(
    () => casinoGroup.name.toLowerCase(),
    [casinoGroup.name]
  );

  // Sync SWR data to local state
  React.useEffect(() => {
    if (!isLoading && counts) {
      setPendingTransaction(counts.transaction);
      setPendingCashouts(counts.cashout);
      setPendingRemittances(counts.remittance);
      setPendingConcerns(counts.concern);
      setPendingTasks(counts.task);
    }
  }, [counts, isLoading]);

  // Pusher event handlers
  const handleCashoutUpdate = React.useCallback((data: { count: number }) => {
    setPendingCashouts(data.count);
  }, []);

  const handleRemittanceUpdate = React.useCallback(
    (data: { count: number }) => {
      setPendingRemittances(data.count);
    },
    []
  );

  const handleConcernUpdate = React.useCallback((data: { count: number }) => {
    setPendingConcerns(data.count);
  }, []);

  const handleTaskUpdate = React.useCallback((data: { count: number }) => {
    setPendingTasks(data.count);
  }, []);

  // Memoized channel names
  const cashoutChannel = React.useMemo(
    () => [`cashout-${casinoGroupLower}`],
    [casinoGroupLower]
  );
  const remittanceChannel = React.useMemo(
    () => [`remittance-${casinoGroupLower}`],
    [casinoGroupLower]
  );
  const concernChannel = React.useMemo(
    () => [`concern-${casinoGroupLower}`],
    [casinoGroupLower]
  );
  const taskChannel = React.useMemo(
    () => [`task-${casinoGroupLower}`],
    [casinoGroupLower]
  );

  // Pusher subscriptions
  usePusher({
    channels: cashoutChannel,
    eventName: "cashout-pending-count",
    onEvent: handleCashoutUpdate,
  });

  usePusher({
    channels: remittanceChannel,
    eventName: "remittance-pending-count",
    onEvent: handleRemittanceUpdate,
  });

  usePusher({
    channels: concernChannel,
    eventName: "concern-pending-count",
    onEvent: handleConcernUpdate,
  });

  usePusher({
    channels: taskChannel,
    eventName: "task-pending-count",
    onEvent: handleTaskUpdate,
  });

  const links: MenuLink[] = React.useMemo(
    () => [
      {
        href: `/${casinoGroupLower}/transaction-requests`,
        text: "Gateway",
        icon: ArrowLeftRight,
        disable: false,
        pendingCount: pendingTransaction,
      },
      {
        href: `/${casinoGroupLower}/accounts`,
        text: "Accounts",
        icon: Users,
        disable: false,
      },
      {
        href: `/${casinoGroupLower}/network`,
        text: "Network",
        icon: Share2,
        disable: false,
      },
      {
        href: `/${casinoGroupLower}/cash-outs`,
        text: "Cash Outs",
        icon: Wallet,
        disable: false,
        pendingCount: pendingCashouts,
      },
      {
        href: `/${casinoGroupLower}/remittance`,
        text: "Remittance",
        icon: BanknoteArrowUp,
        disable: false,
        pendingCount: pendingRemittances,
      },
      {
        href: `/${casinoGroupLower}/concerns`,
        text: "Concerns",
        icon: MessageCircle,
        disable: false,
        pendingCount: pendingConcerns,
      },
      {
        href: `/${casinoGroupLower}/tasks`,
        text: "Tasks",
        icon: CheckSquare,
        disable: false,
        pendingCount: pendingTasks,
      },
    ],
    [
      casinoGroupLower,
      pendingTransaction,
      pendingCashouts,
      pendingRemittances,
      pendingConcerns,
      pendingTasks,
    ]
  );

  const totalPending = React.useMemo(() => {
    return (
      pendingTransaction +
      pendingCashouts +
      pendingRemittances +
      pendingConcerns +
      pendingTasks
    );
  }, [
    pendingTransaction,
    pendingCashouts,
    pendingRemittances,
    pendingConcerns,
    pendingTasks,
  ]);

  // ✅ Helper function to get total badge color classes
  const getTotalBadgeColorClass = React.useCallback(() => {
    if (totalPending === 0) {
      // Green for zero
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800";
    } else {
      // Yellow for other pending items
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-300 dark:border-yellow-800";
    }
  }, [totalPending]);

  const SectionIcon = ClipboardList;

  return (
    <Collapsible className={cn("group/collapsible", className)}>
      <CollapsibleTrigger asChild className="cursor-pointer select-none">
        <SidebarMenuButton>
          <SectionIcon /> {casinoGroup.name.toUpperCase()}
          {/* ✅ Total badge with dynamic color based on transaction status */}
          {isLoading ? (
            <Skeleton className="ml-auto w-6 h-6 rounded-full" />
          ) : (
            <Badge
              className={cn(
                "ml-auto transition-all",
                getTotalBadgeColorClass()
              )}
            >
              {totalPending}
            </Badge>
          )}
          <ChevronRight className="transition-transform group-data-[state=open]/collapsible:rotate-90" />
        </SidebarMenuButton>
      </CollapsibleTrigger>
      <CollapsibleContent
        className={cn(
          "outline-none data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
          "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
        )}
      >
        <SidebarMenuSub>
          {links.map((link, j) => (
            <SidebarMenuItem key={j}>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith(link.href)}
              >
                {link.disable ? (
                  <a className="hover:text-popover-foreground cursor-not-allowed opacity-50">
                    <link.icon />
                    <span>{link.text}</span>
                  </a>
                ) : (
                  <Link
                    href={link.href}
                    className="hover:text-popover-foreground"
                  >
                    <link.icon />
                    <span>{link.text}</span>
                  </Link>
                )}
              </SidebarMenuButton>
              {/* ✅ Only show badge if count > 0, no background color */}
              {typeof link.pendingCount === "number" &&
                link.pendingCount > 0 && (
                  <SidebarMenuBadge
                    className={cn(
                      "peer-hover/menu-button:text-yellow-600 peer-data-[active=true]/menu-button:text-yellow-600 text-yellow-600",
                      "dark:peer-data-[active=true]:text-yellow-400 dark:text-yellow-400"
                    )}
                  >
                    {link.pendingCount}
                  </SidebarMenuBadge>
                )}
            </SidebarMenuItem>
          ))}
        </SidebarMenuSub>
      </CollapsibleContent>
    </Collapsible>
  );
}

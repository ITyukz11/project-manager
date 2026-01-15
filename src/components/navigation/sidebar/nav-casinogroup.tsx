"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeftRight,
  BanknoteArrowDown,
  BanknoteArrowUp,
  CheckSquare,
  ChevronRight,
  ClipboardList,
  Coins,
  MessageCircle,
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

interface MenuLink {
  href: string;
  text: string;
  icon: React.ComponentType;
  disable: boolean;
  pendingCount?: number;
}

export default function NavCasinoGroup({
  casinoGroup,
  className,
}: {
  casinoGroup: { id: string; name: string; is3rdParty: boolean };
  casinoGroupIndex: number;
  className?: string;
}) {
  const pathname = usePathname();

  // ✅ Single SWR call for all counts!
  const { counts, isLoading, mutate } = usePendingCounts(casinoGroup.name);

  const casinoGroupLower = React.useMemo(
    () => casinoGroup.name.toLowerCase(),
    [casinoGroup.name]
  );

  // Pusher event handlers
  const handleTransactionUpdate = (data: { count: number }) => {
    mutate(
      (prev) => ({
        ...prev!,
        transaction: data.count ?? 0,
        total:
          (data.count ?? 0) +
          (prev?.cashin ?? 0) +
          (prev?.cashout ?? 0) +
          (prev?.remittance ?? 0) +
          (prev?.concern ?? 0) +
          (prev?.task ?? 0) +
          (prev?.customerSupport ?? 0),
      }),
      false
    );
  };

  const handleCashinUpdate = (data: { count: number }) => {
    mutate(
      (prev) => ({
        ...prev!,
        cashin: data.count ?? 0,
        total:
          (prev?.transaction ?? 0) +
          (data.count ?? 0) +
          (prev?.cashout ?? 0) +
          (prev?.remittance ?? 0) +
          (prev?.concern ?? 0) +
          (prev?.task ?? 0) +
          (prev?.customerSupport ?? 0),
      }),
      false
    );
  };

  const handleCashoutUpdate = (data: { count: number }) => {
    mutate(
      (prev) => ({
        ...prev!,
        cashout: data.count ?? 0,
        total:
          (prev?.transaction ?? 0) +
          (prev?.cashin ?? 0) +
          (data.count ?? 0) +
          (prev?.remittance ?? 0) +
          (prev?.concern ?? 0) +
          (prev?.task ?? 0) +
          (prev?.customerSupport ?? 0),
      }),
      false
    );
  };

  const handleCommissionUpdate = (data: { count: number }) => {
    mutate(
      (prev) => ({
        ...prev!,
        commission: data.count ?? 0,
        total:
          (prev?.transaction ?? 0) +
          (prev?.cashin ?? 0) +
          (prev?.cashout ?? 0) +
          (data.count ?? 0) +
          (prev?.remittance ?? 0) +
          (prev?.concern ?? 0) +
          (prev?.task ?? 0) +
          (prev?.customerSupport ?? 0),
      }),
      false
    );
  };

  console.log("NavCasinoGroup:", counts.total);

  const handleRemittanceUpdate = (data: { count: number }) => {
    mutate(
      (prev) => ({
        ...prev!,
        remittance: data.count ?? 0,
        total:
          (prev?.transaction ?? 0) +
          (prev?.cashin ?? 0) +
          (prev?.cashout ?? 0) +
          (data.count ?? 0) +
          (prev?.concern ?? 0) +
          (prev?.task ?? 0) +
          (prev?.customerSupport ?? 0),
      }),
      false
    );
  };

  const handleConcernUpdate = (data: { count: number }) => {
    mutate(
      (prev) => ({
        ...prev!,
        concern: data.count ?? 0,
        total:
          (prev?.transaction ?? 0) +
          (prev?.cashin ?? 0) +
          (prev?.cashout ?? 0) +
          (data.count ?? 0) +
          (prev?.remittance ?? 0) +
          (prev?.task ?? 0) +
          (prev?.customerSupport ?? 0),
      }),
      false
    );
  };
  const handleTaskUpdate = (data: { count: number }) => {
    mutate(
      (prev) => ({
        ...prev!,
        task: data.count ?? 0,
        total:
          (prev?.transaction ?? 0) +
          (prev?.cashin ?? 0) +
          (prev?.cashout ?? 0) +
          (prev?.remittance ?? 0) +
          (prev?.concern ?? 0) +
          (data.count ?? 0) +
          (prev?.customerSupport ?? 0),
      }),
      false
    );
  };
  const handleCustomerSupportUpdate = (data: { count: number }) => {
    mutate(
      (prev) => ({
        ...prev!,
        customerSupport: data.count ?? 0,
        total:
          (prev?.transaction ?? 0) +
          (prev?.cashin ?? 0) +
          (prev?.cashout ?? 0) +
          (prev?.remittance ?? 0) +
          (prev?.concern ?? 0) +
          (prev?.task ?? 0) +
          (data.count ?? 0),
      }),
      false
    );
  };

  // Memoized channel names
  const transactionChannel = React.useMemo(
    () => [`transaction-${casinoGroupLower}`],
    [casinoGroupLower]
  );

  const cashinChannel = React.useMemo(
    () => [`cashin-${casinoGroupLower}`],
    [casinoGroupLower]
  );
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
  const commissionChannel = React.useMemo(
    () => [`commission-${casinoGroupLower}`],
    [casinoGroupLower]
  );
  const customerSupportChannel = React.useMemo(
    () => [`customerSupport-${casinoGroupLower}`],
    [casinoGroupLower]
  );

  // Pusher subscriptions

  usePusher({
    channels: transactionChannel,
    eventName: "transaction-pending-count",
    onEvent: handleTransactionUpdate,
  });

  usePusher({
    channels: cashinChannel,
    eventName: "cashin-pending-count",
    onEvent: handleCashinUpdate,
  });

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

  usePusher({
    channels: commissionChannel,
    eventName: "commission-pending-count",
    onEvent: handleCommissionUpdate,
  });

  usePusher({
    channels: customerSupportChannel,
    eventName: "customerSupport-pending-count",
    onEvent: handleCustomerSupportUpdate,
  });

  const links: MenuLink[] = React.useMemo(() => {
    const thirdPartyLinks: MenuLink[] = [
      {
        href: `/${casinoGroupLower}/wallet`,
        text: "Wallet",
        icon: Wallet,
        disable: false,
        pendingCount: 0,
      },
      {
        href: `/${casinoGroupLower}/transaction-requests`,
        text: "Gateway",
        icon: ArrowLeftRight,
        disable: false,
        pendingCount: counts.transaction,
      },
      {
        href: `/${casinoGroupLower}/cash-ins`,
        text: "Cashin",
        icon: BanknoteArrowDown,
        disable: false,
        pendingCount: counts.cashin,
      },
      {
        href: `/${casinoGroupLower}/cash-outs`,
        text: "Cashout",
        icon: BanknoteArrowUp,
        disable: false,
        pendingCount: counts.cashout,
      },
      {
        href: `/${casinoGroupLower}/customer-support`,
        text: "Customer Supp.",
        icon: MessageCircle,
        disable: false,
        pendingCount: counts.customerSupport,
      },
    ];

    const regularLinks: MenuLink[] = [
      {
        href: `/${casinoGroupLower}/dpay`,
        text: "DPay",
        icon: Wallet,
        disable: false,
        pendingCount: counts.transaction,
      },
      {
        href: `/${casinoGroupLower}/transaction-requests`,
        text: "NXTPay",
        icon: Coins,
        disable: false,
        pendingCount: counts.transaction,
      },

      {
        href: `/${casinoGroupLower}/accounts`,
        text: "Accounts",
        icon: Users,
        disable: false,
      },
      {
        href: `/${casinoGroupLower}/commissions`,
        text: "Commissions",
        icon: Coins,
        disable: false,
        pendingCount: counts.commission,
      },
      {
        href: `/${casinoGroupLower}/cash-ins`,
        text: "Cash Ins",
        icon: BanknoteArrowDown,
        disable: false,
        pendingCount: counts.cashin,
      },
      {
        href: `/${casinoGroupLower}/cash-outs`,
        text: "Cash Outs",
        icon: BanknoteArrowUp,
        disable: false,
        pendingCount: counts.cashout,
      },
      {
        href: `/${casinoGroupLower}/remittance`,
        text: "Remittance",
        icon: Wallet,
        disable: false,
        pendingCount: counts.remittance,
      },
      {
        href: `/${casinoGroupLower}/concerns`,
        text: "Concerns",
        icon: MessageCircle,
        disable: false,
        pendingCount: counts.concern,
      },
      {
        href: `/${casinoGroupLower}/tasks`,
        text: "Tasks",
        icon: CheckSquare,
        disable: false,
        pendingCount: counts.task,
      },
    ];

    return casinoGroup.is3rdParty ? thirdPartyLinks : regularLinks;
  }, [
    casinoGroupLower,
    counts.transaction,
    counts.cashin,
    counts.cashout,
    counts.customerSupport,
    counts.commission,
    counts.remittance,
    counts.concern,
    counts.task,
    casinoGroup.is3rdParty,
  ]);

  // ✅ Helper function to get total badge color classes
  const getTotalBadgeColorClass = React.useCallback(() => {
    if (counts.total === 0) {
      // Green for zero
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800";
    } else {
      // Yellow for other pending items
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-300 dark:border-yellow-800";
    }
  }, [counts.total]);

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
              {counts.total}
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

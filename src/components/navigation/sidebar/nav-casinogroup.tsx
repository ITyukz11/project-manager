"use client";

import * as React from "react";
import Link from "next/link";
import {
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
import { useCountCashoutPending } from "@/lib/hooks/swr/cashout/useCountPending";
import { useCountConcernPending } from "@/lib/hooks/swr/concern/useCountPending";
import { useCountRemittancePending } from "@/lib/hooks/swr/remittance/useCountRemittancePending";
import { useCountTaskPending } from "@/lib/hooks/swr/task/useCountTaskPending";
import { Badge } from "@/components/ui/badge";

interface MenuLink {
  href: string;
  text: string;
  icon: React.ComponentType;
  disable: boolean;
  pendingCount?: number;
  loading?: boolean;
}

// Pass the casinoGroup and pathname as props!
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
  console.log("pathname:", pathname);
  const [pendingCashouts, setPendingCashouts] = React.useState<number>(0);
  const [pendingConcerns, setPendingConcerns] = React.useState<number>(0);
  const [pendingRemittances, setPendingRemittances] = React.useState<number>(0);
  const [pendingTasks, setPendingTasks] = React.useState<number>(0);
  const { pendingCashoutCount, pendingCashoutCountIsLoading } =
    useCountCashoutPending(casinoGroup.name);
  const { pendingRemittanceCount, pendingRemittanceCountIsLoading } =
    useCountRemittancePending(casinoGroup.name);
  const { pendingConcernCount, pendingConcernCountIsLoading } =
    useCountConcernPending(casinoGroup.name);

  const { pendingTaskCount, pendingTaskCountIsLoading } = useCountTaskPending(
    casinoGroup.name
  );
  // Update local state when SWR loads initial value
  React.useEffect(() => {
    if (
      !pendingCashoutCountIsLoading &&
      typeof pendingCashoutCount === "number"
    ) {
      setPendingCashouts(pendingCashoutCount);
    }
    if (
      !pendingRemittanceCountIsLoading &&
      typeof pendingRemittanceCount === "number"
    ) {
      setPendingRemittances(pendingRemittanceCount);
    }
    if (
      !pendingConcernCountIsLoading &&
      typeof pendingConcernCount === "number"
    ) {
      setPendingConcerns(pendingConcernCount);
    }
    if (!pendingTaskCountIsLoading && typeof pendingTaskCount === "number") {
      setPendingTasks(pendingTaskCount);
    }
  }, [
    pendingCashoutCount,
    pendingCashoutCountIsLoading,
    pendingConcernCount,
    pendingConcernCountIsLoading,
    pendingRemittanceCount,
    pendingRemittanceCountIsLoading,
    pendingTaskCount,
    pendingTaskCountIsLoading,
  ]);

  // Real-time updates from Pusher
  usePusher({
    channels: [`cashout-${casinoGroup.name.toLowerCase()}`],
    eventName: "cashout-pending-count",
    onEvent: (data: { count: number }) => {
      console.log("Pusher event received:", data);
      setPendingCashouts(data.count);
    },
  });

  // Real-time updates from Pusher
  usePusher({
    channels: [`remittance-${casinoGroup.name.toLowerCase()}`],
    eventName: "remittance-pending-count",
    onEvent: (data: { count: number }) => {
      console.log("Pusher event received:", data);
      setPendingRemittances(data.count);
    },
  });

  // Real-time updates from Pusher
  usePusher({
    channels: [`concern-${casinoGroup.name.toLowerCase()}`],
    eventName: "concern-pending-count",
    onEvent: (data: { count: number }) => {
      console.log("Pusher event received:", data);
      setPendingConcerns(data.count);
    },
  });

  // Real-time updates from Pusher
  usePusher({
    channels: [`task-${casinoGroup.name.toLowerCase()}`],
    eventName: "task-pending-count",
    onEvent: (data: { count: number }) => {
      console.log("Pusher event received:", data);
      setPendingTasks(data.count);
    },
  });

  // Build dynamic nav links for the group, as in your pattern
  const links: MenuLink[] = [
    // // Build per your template! Example:
    {
      href: `/${casinoGroup.name.toLowerCase()}/accounts`,
      text: "Accounts",
      icon: Users,
      disable: false,
    },
    {
      href: `/${casinoGroup.name.toLowerCase()}/network`,
      text: "Network",
      icon: Share2,
      disable: false,
    },
    {
      href: `/${casinoGroup.name.toLowerCase()}/cash-outs`,
      text: "Cash Outs",
      icon: Wallet,
      disable: false,
      pendingCount: pendingCashouts,
      loading: pendingCashoutCountIsLoading,
    },
    {
      href: `/${casinoGroup.name.toLowerCase()}/remittance`,
      text: "Remittance",
      icon: BanknoteArrowUp,
      disable: false,
      pendingCount: pendingRemittances,
      loading: pendingRemittanceCountIsLoading,
    },
    {
      href: `/${casinoGroup.name.toLowerCase()}/concerns`,
      text: "Concerns",
      icon: MessageCircle,
      disable: false,
      pendingCount: pendingConcerns,
      loading: pendingConcernCountIsLoading,
    },
    {
      href: `/${casinoGroup.name.toLowerCase()}/tasks`,
      text: "Tasks",
      icon: CheckSquare,
      disable: false,
      pendingCount: pendingTasks,
    },
  ];

  const totalPending = React.useMemo(() => {
    return (
      pendingCashouts + pendingRemittances + pendingConcerns + pendingTasks
    );
  }, [pendingCashouts, pendingRemittances, pendingConcerns, pendingTasks]);
  // Pick an icon for your casino group, or use a default (optional)
  const SectionIcon = ClipboardList; // or any

  return (
    <Collapsible
      className={cn("group/collapsible", className)}
      defaultOpen={casinoGroupIndex == 0}
    >
      <CollapsibleTrigger asChild className="cursor-pointer select-none">
        <SidebarMenuButton>
          <SectionIcon /> {casinoGroup.name.toUpperCase()}
          <Badge
            variant={"destructive"}
            className="ml-auto transition-transform"
          >
            {totalPending}
          </Badge>
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

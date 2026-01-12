"use client";

import * as React from "react";
import {
  Settings,
  HelpCircle,
  Clock,
  CheckSquare,
  Users,
  Receipt,
} from "lucide-react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useOnlineUsers } from "@/lib/hooks/swr/user/useOnlineUsers";
import { ADMINROLES } from "@/lib/types/role";
import { useSession } from "next-auth/react";

/**
 * A safe icon type for lucide icons:
 * React.ComponentType<SVGProps<SVGSVGElement> & { title?: string }>
 */
type IconType = React.ComponentType<
  React.SVGProps<SVGSVGElement> & { title?: string }
>;

const navSecondary: {
  title: string;
  url: string;
  icon: IconType;
  disable: boolean;
  showBadge?: boolean;
  adminOnly?: boolean;
}[] = [
  // {
  //   title: "NXTLOTTO (Beta)",
  //   url: "/nxtlotto",
  //   icon: Receipt,
  //   disable: false,
  // },
  {
    title: "Online Users",
    url: "/online-users",
    icon: Users,
    disable: false,
    showBadge: true,
    adminOnly: true, // 👈 important
  },
  {
    title: "Attendance Logs",
    url: "/attendance-logs",
    icon: Clock,
    disable: false,
  },
  {
    title: "Ready Check Logs",
    url: "/ready-check-logs",
    icon: CheckSquare,
    disable: false,
  },
  { title: "Configuration", url: "#", icon: Settings, disable: true },
  { title: "Guide", url: "#", icon: HelpCircle, disable: true },
];

export function NavSecondary() {
  const { data: session } = useSession();

  const isAdmin =
    session?.user?.role === ADMINROLES.SUPERADMIN ||
    session?.user?.role === ADMINROLES.ADMIN;

  const { onlineUsersCount, isLoading } = useOnlineUsers(isAdmin);

  const filteredNavSecondary = React.useMemo(() => {
    return navSecondary.filter((item) => {
      if (item.adminOnly && !isAdmin) return false;
      return true;
    });
  }, [isAdmin]);

  return (
    <SidebarGroup className="mt-auto">
      <SidebarGroupContent>
        <SidebarMenu>
          {filteredNavSecondary.map((item) =>
            item.disable ? (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild disabled>
                  <a className="cursor-not-allowed opacity-50">
                    <item.icon className="w-4 h-4" />
                    <span>{item.title}</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ) : (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild>
                  <Link
                    href={item.url}
                    className={`flex items-center gap-2 ${
                      item.showBadge ? "justify-between" : ""
                    } w-full`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.title}</span>
                    {/* Loading skeleton for badge */}
                    {item.showBadge && isLoading && (
                      <div className="ml-auto h-5 w-8 bg-muted animate-pulse rounded" />
                    )}
                    {item.showBadge && isAdmin && !isLoading && (
                      <div className="ml-auto flex items-center gap-1.5">
                        {/* Count badge */}
                        <Badge
                          variant="secondary"
                          className={`px-2 py-0.5 text-xs font-medium ${
                            onlineUsersCount > 0
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800"
                              : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                          }`}
                        >
                          {/* Pulsing green dot indicator */}
                          {onlineUsersCount > 0 && (
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                          )}
                          {onlineUsersCount}
                        </Badge>
                      </div>
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          )}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export default NavSecondary;

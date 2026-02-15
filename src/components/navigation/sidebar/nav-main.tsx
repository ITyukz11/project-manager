"use client";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { ADMINROLES } from "@/lib/types/role";
import { Airplay, Share2, Users } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

export const NavMain = () => {
  const { data } = useSession();
  const pathname = usePathname();

  const role = data?.user?.role;

  const isSuperAdmin = role === ADMINROLES.SUPERADMIN;
  const isAdmin = role === ADMINROLES.ADMIN;

  const items = useMemo(
    () => [
      {
        title: "Casino",
        url: "/casino",
        icon: Airplay,
        visible: isSuperAdmin,
      },
      {
        title: "Accounts",
        url: "/accounts",
        icon: Users,
        visible: isSuperAdmin || isAdmin,
      },
      {
        title: "Network",
        url: "/network/accounts",
        icon: Share2,
        visible: isSuperAdmin || isAdmin,
      },
    ],
    [isSuperAdmin, isAdmin],
  );

  const visibleItems = items.filter((item) => item.visible);

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Main Application</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {visibleItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild isActive={pathname === item.url}>
                <Link href={item.url}>
                  <item.icon />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
};

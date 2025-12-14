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

export const NavMain = () => {
  const { data } = useSession();
  const pathname = usePathname();

  const isSuperAdmin = data?.user?.role === ADMINROLES.SUPERADMIN;

  // Menu items.
  const items = [
    {
      title: "Casino",
      url: "/casino",
      icon: Airplay,
    },
    {
      title: "Accounts",
      url: "/accounts",
      icon: Users,
    },
    {
      title: "Network",
      url: "/network/accounts",
      icon: Share2,
    },
  ];

  // If superadmin show all items, otherwise hide the Casino item.
  const visibleItems = isSuperAdmin
    ? items
    : items.filter((item) => item.title !== "Casino");

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

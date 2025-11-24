"use client";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import { Airplay, Share2, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export const NavMain = () => {
  const pathname = usePathname();
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

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Main Application</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
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

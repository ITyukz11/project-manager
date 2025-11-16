"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { useSession } from "next-auth/react";
import NavSecondary from "./nav-secondary";
import { NavUser } from "./nav-user";
import { navLinks } from "../data/nav-links";

export const AppSidebar = () => {
  const pathname = usePathname();
  const { data: currentUser } = useSession();
  const { state } = useSidebar();
  return (
    <Sidebar
      collapsible="icon"
      className="top-[--header-height]"
      variant="inset"
    >
      {/* Sidebar Header */}
      <SidebarHeader>
        <div className="flex h-fit w-full justify-center border-b pb-2">
          {state == "expanded" ? "PROJECT MANAGER" : "PM"}
        </div>
      </SidebarHeader>
      {/* Sidebar Content */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Applications</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navLinks.map((link) => (
                <SidebarMenuItem key={link.href}>
                  <SidebarMenuButton asChild isActive={pathname === link.href}>
                    <Link href={link.href} className="flex items-center gap-2">
                      <link.icon />
                      <span>{link.text}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator />

        <NavSecondary className="mt-auto" />
      </SidebarContent>

      <SidebarFooter>
        <NavUser
          user={{
            name: currentUser?.user?.username || "",
            email: currentUser?.user?.email || "",
            avatar: "",
          }}
        />
      </SidebarFooter>
    </Sidebar>
  );
};

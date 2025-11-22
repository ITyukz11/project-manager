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
import { ROLES } from "@/lib/types/role";
import { Label } from "@/components/ui/label";

export const AppSidebar = () => {
  const pathname = usePathname();
  const { data: currentUser } = useSession();
  const { state } = useSidebar();
  return (
    <Sidebar
      collapsible="icon"
      className="top-[--header-height] h-[calc(100vh-var(--header-height))] border-r"
      variant="inset"
    >
      {/* Sidebar Header */}
      <SidebarHeader>
        <Label className="flex h-fit w-full justify-center border-b pb-2 font-sans">
          {state == "expanded" ? "PROJECT MANAGER" : "PM"}
        </Label>
      </SidebarHeader>
      {/* Sidebar Content */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Applications</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navLinks.map((link) => {
                if (
                  link.text === "Accounts" &&
                  currentUser?.user?.role !== ROLES.ADMIN
                ) {
                  return null;
                }
                return (
                  <SidebarMenuItem key={link.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === link.href}
                    >
                      <Link
                        href={link.href}
                        className="flex items-center gap-2"
                      >
                        <link.icon />
                        <span>{link.text}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
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

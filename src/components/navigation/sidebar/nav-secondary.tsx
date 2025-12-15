"use client";

import * as React from "react";
import { Settings, HelpCircle, Clock, CheckSquare } from "lucide-react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

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
}[] = [
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

export function NavSecondary(
  props: React.ComponentPropsWithoutRef<typeof SidebarGroup>
) {
  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          {navSecondary.map((item, index) =>
            item.disable ? (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild disabled>
                  <a
                    key={index}
                    className="hover:text-popover-foreground cursor-not-allowed opacity-50"
                  >
                    {/* size via className, aria-hidden since the text is present */}
                    <item.icon className="w-4 h-4" aria-hidden />
                    <span>{item.title}</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ) : (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild disabled>
                  <a href={item.url} className="flex items-center gap-2">
                    {/* size via className, aria-hidden since the text is present */}
                    <item.icon className="w-4 h-4" aria-hidden />
                    <span>{item.title}</span>
                  </a>
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

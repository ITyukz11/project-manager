"use client";

import * as React from "react";
import Link from "next/link";
import {
  CheckSquare,
  ChevronRight,
  ClipboardList,
  MessageCircle,
  Share2,
  Users,
  Wallet,
} from "lucide-react";
import {
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

interface MenuLink {
  href: string;
  text: string;
  icon: React.ComponentType;
  disable: boolean;
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
    },
    {
      href: `/${casinoGroup.name.toLowerCase()}/concerns`,
      text: "Concerns",
      icon: MessageCircle,
      disable: false,
    },
    {
      href: `/${casinoGroup.name.toLowerCase()}/tasks`,
      text: "Tasks",
      icon: CheckSquare,
      disable: false,
    },
  ];

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
          <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
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
            </SidebarMenuItem>
          ))}
        </SidebarMenuSub>
      </CollapsibleContent>
    </Collapsible>
  );
}

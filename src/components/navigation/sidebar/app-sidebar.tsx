"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { useSession } from "next-auth/react";
import NavSecondary from "./nav-secondary";
import { NavUser } from "./nav-user";
import { Label } from "@/components/ui/label";
import NavCasinoGroup from "./nav-casinogroup";
import { Separator } from "@/components/ui/separator";
import { NavMain } from "./nav-main";

// Import Skeleton
import { Skeleton } from "@/components/ui/skeleton";
import { useUserCasinoGroups } from "@/lib/hooks/swr/user/useUserCasinoGroup";

export const AppSidebar = () => {
  const { data: currentUser, status } = useSession();
  const { state } = useSidebar();
  const { casinoGroups, casinoGroupsLoading, casinoGroupsError } =
    useUserCasinoGroups(currentUser?.user?.id);

  return (
    <Sidebar
      collapsible="icon"
      className="top-[--header-height] h-[calc(100vh-var(--header-height))] border-r"
      variant="inset"
    >
      <SidebarHeader>
        <Label className="flex h-fit w-full justify-center border-b pb-2 font-sans">
          {state === "expanded" ? "PROJECT MANAGER" : "PM"}
        </Label>
      </SidebarHeader>
      <SidebarContent>
        <NavMain />
        <SidebarGroup>
          <SidebarGroupLabel>Casino Groups</SidebarGroupLabel>
          {casinoGroupsError && (
            <span className="text-xs text-red-500 px-4">
              Failed to load casino groups.
            </span>
          )}
          {casinoGroupsLoading ? (
            // Show skeleton loading if casinoGroups not yet loaded or empty
            <>
              {/* You can adjust the count or height for placeholders */}
              <Skeleton className="w-full h-8 mb-2" />
              <Skeleton className="w-full h-8 mb-2" />
            </>
          ) : casinoGroups.length === 0 ? (
            // Optionally show empty state instead if desired
            <span className="text-xs text-muted-foreground px-4">
              No casino groups.
            </span>
          ) : (
            casinoGroups.map((group, index) => (
              <NavCasinoGroup
                key={group.id}
                casinoGroup={group}
                casinoGroupIndex={index}
              />
            ))
          )}
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

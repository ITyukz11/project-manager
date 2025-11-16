"use client";

import React, { useEffect, useState } from "react";
import { AppHeader } from "@/components/navigation/app-header";
import { AppSidebar } from "@/components/navigation/sidebar/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { SessionProvider } from "next-auth/react";
import SearchModal from "@/components/SearchModal";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [openSearch, setOpenSearch] = useState<boolean>(false);

  // Global keyboard shortcut: Ctrl/Cmd + K opens the search modal.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const isCmdK = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k";
      if (isCmdK) {
        e.preventDefault();
        setOpenSearch(true);
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <SessionProvider>
      <SidebarProvider defaultOpen={true}>
        <AppSidebar />
        <main className="dark:bg-black bg-[#F1F5F9] flex flex-col flex-1 w-full relative">
          <AppHeader openSearch={() => setOpenSearch(true)} />
          <div className="p-1 sm:p-4">{children}</div>
          <SearchModal open={openSearch} onClose={() => setOpenSearch(false)} />
        </main>
      </SidebarProvider>
    </SessionProvider>
  );
}

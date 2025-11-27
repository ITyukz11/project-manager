"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment, useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ModeToggle } from "../mode-toggle";
import { Button } from "../ui/button";
import { Kbd } from "../ui/kbd";
import { Separator } from "../ui/separator";
/* shadcn breadcrumb components (adjust import path if your project uses a different file name) */
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Bell } from "lucide-react";
import { NotificationDropdown } from "../notification-dropdown";

type Crumb = {
  href: string;
  segment: string;
  labelDefault: string;
};

export type CrumbResolver = (
  segment: string, // decoded segment (e.g. "my-project" or "123")
  href: string, // accumulated href for that crumb (e.g. "/projects/123")
  signal?: AbortSignal
) => string | Promise<string | undefined> | undefined;

function prettifySegment(seg: string) {
  const decoded = decodeURIComponent(seg);
  // If it looks like an id, keep it raw (you can resolve it via resolver if you want nicer label)
  if (/^[0-9a-fA-F-]{8,}$/.test(seg) || /^[0-9]+$/.test(seg)) return decoded;
  return decoded
    .replace(/[-_]+/g, " ")
    .split(" ")
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(" ");
}

function getBreadcrumbs(pathname: string): Crumb[] {
  const path = !pathname
    ? "/"
    : pathname === "/"
    ? "/"
    : pathname.replace(/\/$/, "");
  if (path === "/") return [{ href: "/", segment: "", labelDefault: "Home" }];

  const segments = path.split("/").filter(Boolean);
  const crumbs: Crumb[] = [];
  let accumulated = "";
  segments.forEach((seg) => {
    accumulated += `/${seg}`;
    crumbs.push({
      href: accumulated,
      segment: decodeURIComponent(seg),
      labelDefault: prettifySegment(seg),
    });
  });

  return [{ href: "/", segment: "", labelDefault: "Home" }, ...crumbs];
}

export const AppHeader = ({
  openSearch,
  resolveCrumb,
}: {
  openSearch: () => void;
  resolveCrumb?: CrumbResolver;
}) => {
  const pathname = usePathname() || "/";
  const crumbs = useMemo(() => getBreadcrumbs(pathname), [pathname]);

  // map href -> resolved label
  const [labels, setLabels] = useState<Record<string, string>>({});

  useEffect(() => {
    let mounted = true;
    const ac = new AbortController();

    (async () => {
      try {
        const resolvedPairs = await Promise.all(
          crumbs.map(async (c) => {
            if (!resolveCrumb) return [c.href, c.labelDefault] as const;
            try {
              const r = await resolveCrumb(c.segment, c.href, ac.signal);
              return [c.href, r ?? c.labelDefault] as const;
            } catch {
              return [c.href, c.labelDefault] as const;
            }
          })
        );
        if (!mounted) return;
        setLabels(Object.fromEntries(resolvedPairs));
      } catch {
        if (mounted) {
          const defaults = Object.fromEntries(
            crumbs.map((c) => [c.href, c.labelDefault])
          );
          setLabels(defaults);
        }
      }
    })();

    return () => {
      mounted = false;
      ac.abort();
    };
  }, [crumbs, pathname, resolveCrumb]);

  return (
    <header
      className={clsx("sticky top-0 z-50 border-b bg-card border-border/80")}
    >
      <nav className="px-2 sm:pr-8 flex h-14 w-full items-center gap-2">
        <SidebarTrigger className="p-0" />
        <Separator orientation="vertical" />

        {/* shadcn Breadcrumbs */}
        <Breadcrumb className="text-sm text-muted-foreground">
          <BreadcrumbList>
            {crumbs.map((c, i) => {
              const isLast = i === crumbs.length - 1;
              const label = labels[c.href] ?? c.labelDefault;
              return (
                <Fragment key={c.href}>
                  <BreadcrumbItem>
                    {!isLast ? (
                      <BreadcrumbLink asChild>
                        <Link href={c.href} className="hover:text-foreground">
                          {label}
                        </Link>
                      </BreadcrumbLink>
                    ) : (
                      // last item: plain text / current page
                      <span className="font-medium text-foreground">
                        {label}
                      </span>
                    )}
                  </BreadcrumbItem>

                  {i !== crumbs.length - 1 && <BreadcrumbSeparator />}
                </Fragment>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none" />
          <nav className="flex items-center gap-2 ml-auto">
            <Button size={"sm"} variant={"outline"} onClick={openSearch}>
              Search <Kbd>Ctrl</Kbd>
              <Kbd>K</Kbd>
            </Button>
            <NotificationDropdown />

            <ModeToggle />
          </nav>
        </div>
      </nav>
    </header>
  );
};

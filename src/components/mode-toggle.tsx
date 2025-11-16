"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";

/**
 * Simple theme toggle with centered icons and no flicker.
 */
export function ModeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <Button variant="outline" className="w-9 h-9 p-0" aria-hidden>
        <span className="sr-only">Toggle theme</span>
      </Button>
    );
  }

  const isDark = resolvedTheme === "dark";

  function toggleTheme() {
    setTheme(isDark ? "light" : "dark");
  }

  return (
    <Button
      variant="outline"
      size={"sm"}
      onClick={toggleTheme}
      aria-label="Toggle theme"
      aria-pressed={isDark}
      className="p-0 relative flex items-center justify-center overflow-visible
                 hover:bg-transparent focus:outline-none active:scale-95"
    >
      {/* Sun (visible in light mode). Explicit color + pointer-events-none */}
      <Sun
        className={
          "pointer-events-none relative z-10 h-[1.2rem] w-[1.2rem] " +
          "transition-opacity duration-200 ease-out " +
          (isDark ? "opacity-0 scale-90" : "opacity-100 scale-100")
        }
      />

      {/* Moon (visible in dark mode). Absolutely centered, explicit color */}
      <Moon
        className={
          "pointer-events-none absolute left-1/2 top-1/2 z-10 h-[1.2rem] w-[1.2rem] -translate-x-1/2 -translate-y-1/2 text-slate-200 " +
          "transition-opacity duration-200 ease-out " +
          (isDark ? "opacity-100 scale-100" : "opacity-0 scale-90")
        }
      />

      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}

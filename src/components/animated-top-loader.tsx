"use client";

import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export default function TopLoader() {
  const pathname = usePathname();
  const controls = useAnimation();
  const isNavigating = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Start loading animation when path changes
  useEffect(() => {
    if (!pathname) return;

    // Mark as navigating
    isNavigating.current = true;

    // Reset loader instantly
    controls.set({ width: "0%", opacity: 1 });

    let width = 0;

    // Start gradual loading
    intervalRef.current = setInterval(() => {
      if (!isNavigating.current) return;
      width += Math.random() * 5;
      if (width > 90) width = 90;
      controls.start({
        width: `${width}%`,
        transition: { duration: 0.2, ease: "linear" },
      });
    }, 200);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [pathname, controls]);

  // Complete loader animation when navigation ends
  useEffect(() => {
    if (!pathname) return;

    // Wait for DOM to mount
    const timeout = setTimeout(() => {
      if (isNavigating.current) {
        if (intervalRef.current) clearInterval(intervalRef.current);

        // Finish progress to 100%
        controls
          .start({
            width: "100%",
            transition: { duration: 0.3, ease: "easeOut" },
          })
          .then(() => {
            // Fade out after finishing
            controls.start({
              opacity: 0,
              transition: { duration: 0.2 },
            });
          });

        isNavigating.current = false;
      }
    }, 100);

    return () => clearTimeout(timeout);
  }, [pathname, controls]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 1, width: 0 }}
        animate={controls}
        exit={{ opacity: 0 }}
        className="fixed top-0 left-0 h-1 bg-primary z-50 shadow-lg"
      />
    </AnimatePresence>
  );
}

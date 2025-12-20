"use client";

import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export default function TopLoader() {
  const pathname = usePathname();
  const controls = useAnimation();
  const isNavigating = useRef(false);
  const animationFrameRef = useRef<number | null>(null);
  const widthRef = useRef(0);

  // Start loading animation when path changes
  useEffect(() => {
    if (!pathname) return;

    // Mark as navigating
    isNavigating.current = true;
    widthRef.current = 0;

    // Reset loader instantly
    controls.set({ width: "0%", opacity: 1 });

    // Use requestAnimationFrame for smoother, more efficient animation
    const animate = () => {
      if (!isNavigating.current) return;

      // Increment width gradually
      widthRef.current += Math.random() * 3 + 1; // 1-4% per frame

      // Cap at 90%
      if (widthRef.current > 90) {
        widthRef.current = 90;
      }

      controls.start({
        width: `${widthRef.current}%`,
        transition: { duration: 0.1, ease: "linear" },
      });

      // Continue animation if still navigating and not at 90%
      if (isNavigating.current && widthRef.current < 90) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    // Start the animation loop
    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      // Clean up animation frame on unmount or pathname change
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [pathname, controls]);

  // Complete loader animation when navigation ends
  useEffect(() => {
    if (!pathname) return;

    // Wait for DOM to mount
    const timeout = setTimeout(() => {
      if (isNavigating.current) {
        // Cancel any ongoing animation
        if (animationFrameRef.current !== null) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }

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

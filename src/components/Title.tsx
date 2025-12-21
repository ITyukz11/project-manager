"use client";

import { ReactNode } from "react";
import { RefreshCcw, Radio, TriangleAlert } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CardTitle } from "./ui/card";

interface TitleProps {
  title: string;
  subtitle?: string;
  lastUpdate?: Date | null;
  isRefreshing?: boolean;
  icon?: ReactNode;
  live?: boolean;
  error?: Error | null;
  right?: ReactNode;
}

export function Title({
  title,
  subtitle,
  lastUpdate,
  isRefreshing = false,
  icon,
  live = false,
  error,
  right,
}: TitleProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        {/* Optional left icon */}
        {icon && (
          <div className="hidden sm:block p-2 bg-green-100 dark:bg-green-900/20 rounded-lg shrink-0">
            {icon}
          </div>
        )}

        <div className="flex flex-col">
          <div className="flex flex-row gap-2 items-center">
            <CardTitle className="text-xl sm:text-2xl md:text-3xl font-bold flex flex-row justify-between">
              {title}
              {right && right}
            </CardTitle>

            {/* Last updated / refresh animation */}
            {lastUpdate && (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <RefreshCcw
                  className={`h-4 w-4 transition-transform duration-500 ${
                    isRefreshing ? "animate-spin" : ""
                  }`}
                />
              </div>
            )}
          </div>

          {subtitle && (
            <div className="flex flex-row gap-2 items-center">
              <p className="text-xs md:text-sm text-muted-foreground">
                {subtitle}
              </p>

              {/* Live indicator */}
              {live && (
                <div className="flex items-center gap-1 h-fit px-2 py-1 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-800 shrink-0">
                  <Radio className="h-3 w-3 text-green-500 animate-pulse" />
                  <span className="sm:block hidden text-xs font-medium text-green-700 dark:text-green-400">
                    Live
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Optional error tooltip */}
      {error && (
        <div className="flex flex-row gap-4 items-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <TriangleAlert className="text-red-500" />
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={6} className="max-w-xs">
              <div className="text-sm text-red-400 dark:text-red-700">
                {error?.message ||
                  "Error loading data. Please try again later."}
              </div>
            </TooltipContent>
          </Tooltip>
        </div>
      )}
    </div>
  );
}

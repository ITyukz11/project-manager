import { useEffect, useMemo, useState } from "react";
import { format, isSameDay } from "date-fns";
import type { DateRange } from "react-day-picker";
import { startOfMonth, subDays } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

interface DateRangePopoverProps {
  value?: DateRange;
  onChange?: (range: DateRange | undefined) => void;
}

export function DateRangePopover({ value, onChange }: DateRangePopoverProps) {
  const [isSmall, setIsSmall] = useState(false);

  const startOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);

  const endOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

  const now = new Date();
  const today = startOfDay(now);

  // ---- PRESETS ----
  const yesterdayDate = subDays(today, 1);

  const yesterday = {
    from: startOfDay(yesterdayDate),
    to: endOfDay(yesterdayDate),
  };

  const last7Days = {
    from: startOfDay(subDays(today, 6)),
    to: endOfDay(today),
  };

  const last30Days = {
    from: startOfDay(subDays(today, 29)),
    to: endOfDay(today),
  };

  const monthToDate = {
    from: startOfDay(startOfMonth(today)),
    to: endOfDay(today),
  };

  const [month, setMonth] = useState<Date>(today);

  // ---- TEMP DATERANGE STATE FOR CALENDAR SELECTION ----
  // Used for "Apply Filter" workflow from calendar selection
  const [tempRange, setTempRange] = useState<DateRange | undefined>(undefined);
  const [showApply, setShowApply] = useState(false);

  // helper to check if a preset is active
  const isActive = (range: DateRange) => {
    if (!value) return false;
    return (
      isSameDay(range.from!, value.from!) &&
      isSameDay(range.to! ?? range.from, value.to ?? value.from!)
    );
  };

  useEffect(() => {
    const handleResize = () => {
      setIsSmall(window.innerWidth < 640); // sm breakpoint ~640px
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Shortened label for small screens
  const label = useMemo(() => {
    if (!value?.from) return "Pick date range";
    if (value.to)
      return isSmall
        ? `${format(value.from, "MMM dd")} – ${format(value.to, "MMM dd")}`
        : `${format(value.from, "MMM dd, yyyy")} – ${format(
            value.to,
            "MMM dd, yyyy",
          )}`;
    return isSmall
      ? format(value.from, "MMM dd")
      : format(value.from, "MMM dd, yyyy");
  }, [value, isSmall]);

  // Clear tempRange if value changes from outside (preset/prop changes/etc)
  useEffect(() => {
    if (tempRange !== undefined) setTempRange(undefined);
    if (showApply !== false) setShowApply(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const onCalendarSelect = (range: DateRange | undefined) => {
    if (!range?.from) {
      setTempRange(undefined);
      setShowApply(false);
      return;
    }
    if (range.from > today) return;
    if (range.to && range.to > today) return;

    setTempRange(range);
    setShowApply(
      !!(range.from && range.to && !isSameDay(range.from, range.to)),
    );
    // Always show Apply; allow single day select + apply for simpler logic
    setShowApply(true);
  };

  const handleApply = () => {
    if (tempRange && tempRange.from) {
      onChange?.(tempRange);
      setShowApply(false);
    }
  };

  const handlePreset = (range: DateRange) => {
    onChange?.(range);
    setTempRange(undefined);
    setShowApply(false);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 w-fit justify-start text-left font-normal truncate"
        >
          <CalendarIcon className="h-4 w-4" />
          {label}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-auto max-h-[60vh] overflow-y-auto p-0 sm:h-full"
      >
        <Card className="max-w-xs py-4">
          <CardContent className="px-4">
            <Calendar
              mode="range"
              selected={tempRange ?? value}
              month={month}
              onMonthChange={setMonth}
              disabled={{ after: today }}
              onSelect={onCalendarSelect}
              className="w-full bg-transparent p-0"
            />
          </CardContent>

          <CardFooter className="flex flex-wrap gap-2 border-t px-4 w-full pt-4!">
            <Preset
              label="Today"
              range={{ from: today, to: today }}
              onSelect={handlePreset}
              active={isActive({ from: today, to: today })}
            />
            <Preset
              label="Yesterday"
              range={yesterday}
              onSelect={handlePreset}
              active={isActive(yesterday)}
            />
            <Preset
              label="Last 7 days"
              range={last7Days}
              onSelect={handlePreset}
              active={isActive(last7Days)}
            />
            <Preset
              label="Last 30 days"
              range={last30Days}
              onSelect={handlePreset}
              active={isActive(last30Days)}
            />
            <Preset
              label="Month to date"
              range={monthToDate}
              onSelect={handlePreset}
              active={isActive(monthToDate)}
            />
            {/* Show "Apply Filter" only when user is selecting via calendar */}
            {showApply && (
              <div className="flex w-full pb-0">
                <Button
                  className="w-full"
                  variant="default"
                  size="sm"
                  onClick={handleApply}
                  disabled={!tempRange?.from}
                >
                  Apply Filter
                </Button>
              </div>
            )}
          </CardFooter>
        </Card>
      </PopoverContent>
    </Popover>
  );
}

function Preset({
  label,
  range,
  onSelect,
  active = false,
}: {
  label: string;
  range: DateRange;
  onSelect?: (range: DateRange) => void;
  active?: boolean;
}) {
  return (
    <Button
      variant={active ? "default" : "outline"}
      size="sm"
      onClick={() => onSelect?.(range)}
    >
      {label}
    </Button>
  );
}

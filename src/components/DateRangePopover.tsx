import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { format, isSameDay, startOfMonth, subDays } from "date-fns";
import type { DateRange } from "react-day-picker";
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

// Normalize a Date to PH midnight
const normalizeToMidnight = (date?: Date) => {
  if (!date) return undefined;
  const d = new Date(date);
  d.setHours(0, 0, 0, 0); // PH local midnight
  return d;
};

export function DateRangePopover({ value, onChange }: DateRangePopoverProps) {
  const [isSmall, setIsSmall] = useState(false);

  const today = new Date();
  const normalize = normalizeToMidnight;

  // ---- PRESETS ----
  const yesterday = {
    from: normalize(subDays(today, 1)),
    to: normalize(subDays(today, 1)),
  };
  const last7Days = {
    from: normalize(subDays(today, 6)),
    to: normalize(today),
  };
  const last30Days = {
    from: normalize(subDays(today, 29)),
    to: normalize(today),
  };
  const monthToDate = {
    from: normalize(startOfMonth(today)),
    to: normalize(today),
  };

  const [month, setMonth] = useState<Date>(today);

  // ---- TEMP DATERANGE STATE FOR CALENDAR SELECTION ----
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
      setIsSmall(window.innerWidth < 640);
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
    // defer reset to avoid cascading render warning
    const id = setTimeout(() => {
      setTempRange(undefined);
      setShowApply(false);
    }, 0);

    return () => clearTimeout(id);
  }, [value]);

  const onCalendarSelect = (range: DateRange | undefined) => {
    if (!range?.from) {
      setTempRange(undefined);
      setShowApply(false);
      return;
    }
    if (range.from > today) return;
    if (range.to && range.to > today) return;

    // Normalize to PH midnight
    const normalizedRange = {
      from: normalize(range.from),
      to: range.to ? normalize(range.to) : normalize(range.from),
    };

    setTempRange(normalizedRange);
    setShowApply(true); // always show apply for calendar
  };

  const handleApply = () => {
    if (tempRange && tempRange.from) {
      onChange?.(tempRange);
      setShowApply(false);
    }
  };

  const handlePreset = (range: DateRange) => {
    const normalizedRange = {
      from: normalize(range.from),
      to: normalize(range.to ?? range.from),
    };
    onChange?.(normalizedRange);
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
              range={{ from: normalize(today), to: normalize(today) }}
              onSelect={handlePreset}
              active={isActive({
                from: normalize(today),
                to: normalize(today),
              })}
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

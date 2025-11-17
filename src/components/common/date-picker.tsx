"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface DatePickerProps extends Omit<React.ComponentProps<typeof Button>, "value" | "onChange"> {
  value?: Date | string | null
  onChange: (date: Date | undefined) => void
  placeholder?: string
}

/**
 * Reusable controlled DatePicker component
 * - Fully compatible with React Hook Form's Controller
 * - Allows dynamic error border styling
 */
export function DatePicker({ value, onChange, placeholder = "Select date", className, disabled, ...props }: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  const dateValue = React.useMemo(() => {
    if (!value) return undefined
    if (value instanceof Date) return isNaN(value.getTime()) ? undefined : value
    const parsed = new Date(value)
    return isNaN(parsed.getTime()) ? undefined : parsed
  }, [value])

  const handleDateSelect = (newDate?: Date) => {
    onChange(newDate)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className={cn("w-full rounded-md border", "focus-within:ring-2 focus-within:ring-offset-2 transition-all", className)}>
          <Button
            variant="ghost"
            type="button"
            disabled={disabled}
            className={cn("w-full justify-start text-left font-normal shadow-none hover:bg-transparent", !dateValue && "text-muted-foreground")}
            {...props}
          >
            {dateValue ? dateValue.toLocaleDateString("en-US") : placeholder}
            <CalendarIcon className="ml-auto h-4 w-4 opacity-70" />
          </Button>
        </div>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar mode="single" selected={dateValue} onSelect={handleDateSelect} captionLayout="dropdown" className="p-2" />
      </PopoverContent>
    </Popover>
  )
}

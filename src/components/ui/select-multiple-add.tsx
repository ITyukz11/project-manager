"use client"

import * as React from "react"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Command, CommandInput, CommandList, CommandGroup, CommandItem, CommandEmpty, CommandSeparator } from "@/components/ui/command"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { ChevronsUpDown, ChevronRight, Check, X, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

type Option = {
  value: string
  label: string
  children?: Option[]
}

interface SelectMultipleAddProps {
  options: Option[]
  placeholder?: string
  className?: string
  buttonClassName?: string
  selectClassName?: string
  multiple?: boolean
  value?: string[] | string
  onChange?: (value: string[] | string) => void
  addNewLabel?: string
  onAddNew?: () => void
  disabled?: boolean
}

export const SelectMultipleAdd: React.FC<SelectMultipleAddProps> = ({
  options,
  placeholder = "Select...",
  className,
  buttonClassName = "",
  selectClassName = "",
  multiple = true,
  value: controlledValue,
  onChange,
  addNewLabel,
  onAddNew,
  disabled
}) => {
  const [open, setOpen] = React.useState(false)
  const [activeParent, setActiveParent] = React.useState<Option | null>(null)
  const [value, setValue] = React.useState<string[] | string>(controlledValue || (multiple ? [] : ""))

  const isControlled = controlledValue !== undefined

  const currentValue = isControlled ? controlledValue : value

  const handleSelect = (selectedValue: string) => {
    let newValue: string[] | string
    if (!multiple) {
      newValue = selectedValue
      setOpen(false)
    } else {
      const arr = Array.isArray(currentValue) ? [...(currentValue as string[])] : []
      const index = arr.indexOf(selectedValue)
      if (index > -1) arr.splice(index, 1)
      else arr.push(selectedValue)
      newValue = arr
    }

    if (!isControlled) setValue(newValue)
    onChange?.(newValue)
  }

  const handleRemove = (val: string) => {
    if (!multiple) {
      if (!isControlled) setValue("")
      onChange?.("")
    } else {
      const arr = (currentValue as string[]).filter(v => v !== val)
      if (!isControlled) setValue(arr)
      onChange?.(arr)
    }
  }

  const renderBadges = () => {
    if (multiple && Array.isArray(currentValue)) {
      return (
        <div className="flex flex-wrap gap-1">
          {currentValue.map(v => (
            <Badge key={v} variant="outline" className="flex items-center gap-1">
              {getLabel(v)}
              <span
                role="button"
                tabIndex={0}
                className="ml-1 cursor-pointer text-muted-foreground hover:text-foreground"
                onClick={e => {
                  e.stopPropagation()
                  handleRemove(v)
                }}
              >
                <X className="size-3" />
              </span>
            </Badge>
          ))}
        </div>
      )
    }
    return currentValue ? getLabel(currentValue as string) : placeholder
  }

  const getLabel = (val: string): string => {
    const find = (opts: Option[]): Option | undefined => {
      for (const o of opts) {
        if (o.value === val) return o
        if (o.children) {
          const found = find(o.children)
          if (found) return found
        }
      }
      return undefined
    }
    return find(options)?.label || val
  }
  return (
    <div className={cn("space-y-1 w-full border", className)}>
      <Popover open={open && !disabled} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div
            role="button"
            tabIndex={disabled ? -1 : 0}
            onClick={() => !disabled && setOpen(prev => !prev)}
            className={cn(
              "flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-all",
              disabled ? "opacity-50 cursor-not-allowed bg-muted text-muted-foreground" : "hover:bg-accent hover:text-accent-foreground focus:outline-none",
              "focus:outline-none",
              buttonClassName
            )}
          >
            <div className="flex flex-wrap gap-1">{renderBadges()}</div>
            <ChevronsUpDown className="ml-2 size-4 opacity-50" />
          </div>
        </PopoverTrigger>
        <PopoverContent align="start" className={cn("w-full min-w-[var(--radix-popover-trigger-width)] p-0", selectClassName)}>
          <Command className="w-full">
            <CommandInput placeholder="Search..." className="w-full" />
            <CommandList className="w-full">
              <CommandEmpty>No results found.</CommandEmpty>

              {!activeParent &&
                options.map(parent => (
                  <CommandItem key={parent.value} onSelect={() => (parent.children ? setActiveParent(parent) : handleSelect(parent.value))}>
                    {parent.label}
                    {parent.children ? (
                      <ChevronRight className="ml-auto size-4" />
                    ) : (
                      (multiple ? Array.isArray(currentValue) && currentValue.includes(parent.value) : currentValue === parent.value) && (
                        <Check className="ml-auto size-4" />
                      )
                    )}
                  </CommandItem>
                ))}

              {activeParent && (
                <>
                  <CommandItem onSelect={() => setActiveParent(null)} className="text-muted-foreground">
                    ← Back
                  </CommandItem>
                  <CommandGroup heading={activeParent.label}>
                    {activeParent.children?.map(child => (
                      <CommandItem key={child.value} onSelect={() => handleSelect(child.value)}>
                        {child.label}
                        {(multiple ? Array.isArray(currentValue) && currentValue.includes(child.value) : currentValue === child.value) && (
                          <Check className="ml-auto size-4" />
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}
            </CommandList>
            {onAddNew && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <Button variant="ghost" size="sm" className="w-full justify-start font-normal px-1.5" onClick={onAddNew}>
                    <Plus className="size-4 mr-1" aria-hidden="true" />
                    {addNewLabel}
                  </Button>
                </CommandGroup>
              </>
            )}
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}

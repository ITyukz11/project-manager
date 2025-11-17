"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandGroup,
  CommandItem,
  CommandEmpty,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { ChevronsUpDown, ChevronRight, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MultiLevelItem {
  label: string;
  value: string;
  children?: MultiLevelItem[];
}

interface SelectMultiLevelProps {
  items: MultiLevelItem[];
  value?: string | string[];
  onChange?: (value: string | string[]) => void;
  multiple?: boolean;
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  maxShownBadges?: number;
  disabled?: boolean;
}

/** Utility: find label by value recursively */
function findLabel(items: MultiLevelItem[], value: string): string | undefined {
  for (const item of items) {
    if (item.value === value) return item.label;
    if (item.children) {
      const found = findLabel(item.children, value);
      if (found) return found;
    }
  }
}

export function SelectMultiLevel({
  items,
  value,
  onChange,
  multiple = false,
  placeholder = "Select item...",
  className,
  buttonClassName,
  maxShownBadges = 2,
  disabled = false,
}: SelectMultiLevelProps) {
  const [open, setOpen] = React.useState(false);
  const [showAllBadges, setShowAllBadges] = React.useState(false);

  const selectedValues = Array.isArray(value) ? value : value ? [value] : [];

  const handleSelect = (val: string) => {
    if (disabled) return;
    if (multiple) {
      const updated = selectedValues.includes(val)
        ? selectedValues.filter((v) => v !== val)
        : [...selectedValues, val];
      onChange?.(updated);
    } else {
      onChange?.(val);
      setOpen(false);
    }
  };

  const handleRemove = (val: string) => {
    if (disabled) return;
    if (multiple) onChange?.(selectedValues.filter((v) => v !== val));
    else onChange?.("");
  };

  const shown = showAllBadges
    ? selectedValues
    : selectedValues.slice(0, maxShownBadges);
  const hiddenCount = selectedValues.length - shown.length;
  const getLabel = (val: string) => findLabel(items, val) || val;

  return (
    <Popover open={open && !disabled} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          disabled={disabled}
          variant="outline"
          role="combobox"
          aria-expanded={!disabled && open}
          className={cn(
            "h-auto min-h-8 w-full justify-between text-left hover:bg-transparent",
            buttonClassName
          )}
        >
          <div className="flex flex-wrap items-center gap-1 pr-2.5 w-full">
            {multiple && selectedValues.length > 0 ? (
              <>
                {shown.map((val) => (
                  <Badge
                    key={val}
                    variant="outline"
                    className="flex items-center gap-1"
                  >
                    <span>{getLabel(val)}</span>
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(val);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleRemove(val);
                        }
                      }}
                      className="ml-1 inline-flex items-center justify-center rounded-sm hover:bg-muted cursor-pointer size-4"
                    >
                      <X className="size-3" />
                    </span>
                  </Badge>
                ))}
                {hiddenCount > 0 && (
                  <Badge
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!disabled) setShowAllBadges(!showAllBadges);
                    }}
                    className={cn(
                      "cursor-pointer select-none",
                      disabled && "opacity-50 pointer-events-none"
                    )}
                  >
                    {showAllBadges ? "Show less" : `+${hiddenCount} more`}
                  </Badge>
                )}
              </>
            ) : !multiple && selectedValues.length === 1 ? (
              <span>{getLabel(selectedValues[0])}</span>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 size-4 text-muted-foreground/80 shrink-0" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className={cn(
          "p-0 w-full min-w-[var(--radix-popover-trigger-width)]",
          className
        )}
        align="start"
      >
        <RecursiveMenu
          items={items}
          selectedValues={selectedValues}
          onSelect={handleSelect}
          multiple={multiple}
          disabled={disabled}
        />
      </PopoverContent>
    </Popover>
  );
}

/** Recursive Menu with search */
function RecursiveMenu({
  items,
  selectedValues,
  onSelect,
  multiple,
  disabled,
}: {
  items: MultiLevelItem[];
  selectedValues: string[];
  onSelect: (value: string) => void;
  multiple: boolean;
  disabled: boolean;
}) {
  const [query, setQuery] = React.useState("");
  const filteredItems = query
    ? items.filter((i) => i.label.toLowerCase().includes(query.toLowerCase()))
    : items;

  return (
    <Command className="w-full">
      <CommandInput
        placeholder="Search..."
        value={query}
        onValueChange={setQuery}
        className="w-full"
        disabled={disabled}
      />
      <CommandList className="w-full">
        <CommandEmpty>No items found.</CommandEmpty>
        <CommandGroup className="w-full">
          {filteredItems.map((item) => (
            <RecursiveItem
              key={item.value}
              item={item}
              onSelect={onSelect}
              selectedValues={selectedValues}
              multiple={multiple}
              disabled={disabled}
            />
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );
}

/** Recursive item renderer (handles nested popovers) */
function RecursiveItem({
  item,
  selectedValues,
  onSelect,
  multiple,
  disabled,
}: {
  item: MultiLevelItem;
  selectedValues: string[];
  onSelect: (value: string) => void;
  multiple: boolean;
  disabled: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const hasChildren = item.children?.length;
  const isSelected = selectedValues.includes(item.value);

  const handleClick = () => {
    if (disabled) return;
    if (hasChildren) setOpen(!open);
    else onSelect(item.value);
  };

  if (!hasChildren) {
    return (
      <CommandItem
        onSelect={handleClick}
        className={cn(
          "flex justify-between cursor-pointer w-full",
          disabled && "pointer-events-none opacity-50"
        )}
      >
        {item.label}
        {multiple && isSelected && <Check className="h-4 w-4 opacity-70" />}
      </CommandItem>
    );
  }

  return (
    <Popover open={open && !disabled} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <CommandItem
          onSelect={handleClick}
          className={cn(
            "flex justify-between cursor-pointer w-full",
            disabled && "pointer-events-none opacity-50"
          )}
        >
          {item.label}
          <ChevronRight className="h-4 w-4 opacity-50" />
        </CommandItem>
      </PopoverTrigger>
      <PopoverContent
        side="right"
        align="start"
        sideOffset={4}
        className="p-0 w-auto min-w-[8rem] max-w-[16rem]"
      >
        <RecursiveMenu
          items={item.children!}
          selectedValues={selectedValues}
          onSelect={onSelect}
          multiple={multiple}
          disabled={disabled}
        />
      </PopoverContent>
    </Popover>
  );
}

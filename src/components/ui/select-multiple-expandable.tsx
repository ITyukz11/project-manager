"use client";

import * as React from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, X, ChevronDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";

// --- Type Definitions ---

export type SelectItem = { [key: string]: any };
export type SelectItemGroup = { group: string; items: SelectItem[] };
export type SelectDataSource = SelectItem[] | SelectItemGroup[];

export interface MultiSelectExpandableProps
  extends React.ComponentPropsWithoutRef<"div"> {
  items?: SelectDataSource;
  selectedValues: string[];
  onValuesChange: (newValues: string[]) => void;
  onSearchChange?: (query: string) => void;
  valueField?: string;
  labelField?: string;
  tooltipField?: string;
  isLoading?: boolean;
  maxShownItems?: number;
  placeholder?: string;
  searchPlaceholder?: string;
  maxDropdownHeight?: string;
  disabled?: boolean;
  fullWidth?: boolean;
}

// --- Utility Functions ---
const flattenItems = (items: SelectDataSource | undefined): SelectItem[] => {
  if (!items || items.length === 0) return [];
  if (
    (items as SelectItemGroup[])[0] &&
    "group" in (items as SelectItemGroup[])[0]
  ) {
    return (items as SelectItemGroup[]).flatMap((group) => group.items);
  }
  return items as SelectItem[];
};

function MultiSelectExpandable({
  items: rawItems = [],
  selectedValues,
  onValuesChange,
  onSearchChange,
  valueField = "value",
  labelField = "label",
  tooltipField = "",
  isLoading = false,
  maxShownItems = 2,
  placeholder = "Select items...",
  searchPlaceholder = "Search...",
  maxDropdownHeight = "300px",
  className,
  disabled = false,
  fullWidth = false,
  ...props
}: MultiSelectExpandableProps) {
  const [open, setOpen] = React.useState(false);
  const [expanded, setExpanded] = React.useState(false);
  const [internalSearchQuery, setInternalSearchQuery] = React.useState("");
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const [triggerWidth, setTriggerWidth] = React.useState<number | undefined>(
    undefined
  );

  const flatItems = React.useMemo(() => flattenItems(rawItems), [rawItems]);
  const isGrouped = React.useMemo(
    () => rawItems && rawItems.length > 0 && "group" in rawItems[0],
    [rawItems]
  );

  const getItemValue = (item: SelectItem) => item[valueField];
  const getItemLabel = (item: SelectItem) => item[labelField];
  const getTooltipLabel = (item: SelectItem) =>
    item[tooltipField] || getItemLabel(item);

  // --- Handlers ---
  const toggleSelection = (value: string) => {
    const isSelected = selectedValues.includes(value);
    const newValues = isSelected
      ? selectedValues.filter((v) => v !== value)
      : [...selectedValues, value];
    onValuesChange(newValues);
  };

  const removeSelection = (value: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const newValues = selectedValues.filter((v) => v !== value);
    onValuesChange(newValues);
    if (expanded && newValues.length <= maxShownItems) setExpanded(false);
  };

  const handleSearchChange = (query: string) => {
    setInternalSearchQuery(query);
    onSearchChange?.(query);
  };

  React.useEffect(() => {
    if (triggerRef.current && fullWidth) {
      setTriggerWidth(triggerRef.current.offsetWidth);
    }
    // eslint-disable-next-line react-hooks/refs
  }, [triggerRef.current?.offsetWidth, fullWidth, selectedValues]);

  const visibleValues = expanded
    ? selectedValues
    : selectedValues.slice(0, maxShownItems);
  const hiddenCount = selectedValues.length - visibleValues.length;
  const getItemByValue = (value: string) =>
    flatItems.find((item) => getItemValue(item) === value);

  const renderCommandItems = (itemsToRender: SelectItem[]) =>
    itemsToRender.map((item) => {
      const itemValue = getItemValue(item);
      const itemLabel = getItemLabel(item);
      const tooltipLabel = getTooltipLabel(item);
      const isSelected = selectedValues.includes(itemValue);

      return (
        <CommandItem
          key={itemValue}
          value={itemLabel}
          className="whitespace-nowrap"
          onSelect={() => toggleSelection(itemValue)}
        >
          <Check
            className={cn(
              "mr-2 h-4 w-4",
              isSelected ? "opacity-100" : "opacity-0"
            )}
          />
          {tooltipField ? (
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <span className="flex items-center gap-2 truncate">
                  {item.flag && <span className="text-sm">{item.flag}</span>}
                  {itemLabel}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>{tooltipLabel}</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <span className="flex items-center gap-2 truncate">
              {item.flag && <span className="text-sm">{item.flag}</span>}
              {itemLabel}
            </span>
          )}
        </CommandItem>
      );
    });

  const renderCommandListContent = () => {
    if (isGrouped) {
      return (rawItems as SelectItemGroup[]).map((group) => (
        <CommandGroup key={group.group} heading={group.group}>
          {renderCommandItems(group.items)}
        </CommandGroup>
      ));
    }
    return (
      <CommandGroup>
        {renderCommandItems(rawItems as SelectItem[])}
      </CommandGroup>
    );
  };

  return (
    <div className={cn("min-w-[100px]", className)} {...props}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={triggerRef}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="h-auto w-full justify-between p-1.5"
            disabled={isLoading || disabled}
          >
            {isLoading ? (
              <span className="flex items-center gap-2 text-sm text-muted-foreground px-2">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Fetching...
              </span>
            ) : (
              <div className="flex flex-wrap items-center gap-1">
                {selectedValues.length > 0 ? (
                  <>
                    {visibleValues.map((val, index) => {
                      const item = getItemByValue(val);
                      if (!item) return null;
                      const itemLabel = getItemLabel(item);

                      return (
                        <Badge key={val + index} className="pr-1.5">
                          <span className="flex items-center gap-1">
                            {item.flag && <span>{item.flag}</span>}
                            {itemLabel}
                          </span>
                          <span
                            className="cursor-pointer ml-1 shrink-0 rounded-full p-[1px] opacity-70 transition duration-150 ease-in-out hover:bg-white hover:text-black hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                            onClick={(e) => removeSelection(val, e)}
                            aria-label={`Remove ${itemLabel}`}
                          >
                            <X className="h-3 w-3" />
                          </span>
                        </Badge>
                      );
                    })}
                    {hiddenCount > 0 || expanded ? (
                      <Badge
                        variant="outline"
                        className="cursor-pointer bg-transparent px-2 text-xs text-muted-foreground hover:bg-accent"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpanded((prev) => !prev);
                        }}
                      >
                        {expanded ? "Show Less" : `+${hiddenCount} more`}
                      </Badge>
                    ) : null}
                  </>
                ) : (
                  <span className="text-sm text-muted-foreground px-2">
                    {placeholder}
                  </span>
                )}
              </div>
            )}
            {!isLoading && (
              <ChevronDown
                className={cn(
                  "ml-2 h-4 w-4 shrink-0 opacity-50 transition-transform duration-200",
                  open && "rotate-180"
                )}
              />
            )}
          </Button>
        </PopoverTrigger>

        <PopoverContent
          className="min-w-fit p-0"
          style={{ width: fullWidth ? triggerWidth : undefined }}
          align="start"
        >
          <Command>
            <CommandInput
              placeholder={searchPlaceholder}
              value={internalSearchQuery}
              onValueChange={handleSearchChange}
            />
            <ScrollArea
              className="max-h-[500px]"
              style={{ maxHeight: maxDropdownHeight }}
            >
              <CommandList>
                {isLoading ? (
                  <div className="space-y-2 p-2">
                    {[...Array(1)].map((_, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 px-2 py-1.5"
                      >
                        <Skeleton className="h-4 rounded-md w-full" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <CommandEmpty>No results found.</CommandEmpty>
                    {renderCommandListContent()}
                  </>
                )}
              </CommandList>
              <ScrollBar />
            </ScrollArea>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export { MultiSelectExpandable };

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { ArrowRight } from "lucide-react";
import { Label } from "./ui/label";
import { Kbd } from "./ui/kbd";
import {
  avoidDefaultDomBehavior,
  handleKeyDown,
} from "@/lib/utils/dialogcontent.utils";

type Item = { id: string; title: string; href: string; group: string };

const ITEMS: Item[] = [
  {
    id: "accounts",
    title: "Accounts",
    href: "/accounts",
    group: "Pages",
  },
  {
    id: "network",
    title: "Network",
    href: "/network",
    group: "Pages",
  },
  {
    id: "cash-outs",
    title: "Cash Outs",
    href: "/cash-outs",
    group: "Pages",
  },
  {
    id: "tasks",
    title: "Tasks",
    href: "/tasks",
    group: "Pages",
  },
];

interface SearchModalProps {
  open?: boolean;
  onClose?: () => void;
}

export default function SearchModal({
  open: openProp,
  onClose,
}: SearchModalProps) {
  const router = useRouter();

  // Use controlled mode when openProp is provided, otherwise fall back to internal state
  const isControlled = typeof openProp === "boolean";
  const [internalOpen, setInternalOpen] = React.useState(false);
  const open = isControlled ? (openProp as boolean) : internalOpen;

  const [value, setValue] = React.useState("");

  // Keyboard shortcut only active in uncontrolled mode (parent likely handles global hotkeys)
  React.useEffect(() => {
    if (isControlled) return; // don't interfere with parent-controlled open state

    function onKey(e: KeyboardEvent) {
      const isCmdK = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k";
      if (isCmdK) {
        e.preventDefault();
        setInternalOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isControlled]);

  const groups = React.useMemo(() => {
    const q = value.trim().toLowerCase();
    const filtered = q.length
      ? ITEMS.filter((it) => it.title.toLowerCase().includes(q))
      : ITEMS;
    return filtered.reduce<Record<string, Item[]>>((acc, it) => {
      (acc[it.group] ??= []).push(it);
      return acc;
    }, {});
  }, [value]);

  function handleOpenChange(nextOpen: boolean) {
    if (isControlled) {
      // when parent controls open, only notify about close (parent owns open=true)
      if (!nextOpen) onClose?.();
    } else {
      setInternalOpen(nextOpen);
    }
  }

  function onSelectItem(href: string) {
    handleOpenChange(false);
    // navigate client-side
    router.push(href);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="rounded-2xl overflow-hidden sm:max-w-lg w-[min(90vw,600px)] gap-0 border-accent p-0 border-4 [&>button]:hidden"
        onPointerDownOutside={avoidDefaultDomBehavior}
        onInteractOutside={avoidDefaultDomBehavior}
        onKeyDown={handleKeyDown}
      >
        <DialogTitle className="hidden"></DialogTitle>
        <Command className="rounded-1xl dark:border-gray-900 border-accent">
          <div className="p-2 relative">
            <CommandInput
              placeholder="Search "
              value={value}
              onValueChange={(v) => setValue(v)}
            />
          </div>
          <CommandList className="overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <CommandEmpty>No results found.</CommandEmpty>

            {["Pages", "Get Started"].map((groupName) => {
              const items = groups[groupName] ?? [];
              if (items.length === 0) return null;

              return (
                <CommandGroup key={groupName} heading={groupName}>
                  {items.map((item) => (
                    <CommandItem
                      key={item.id}
                      onSelect={() => onSelectItem(item.href)}
                      className="flex items-center justify-start p-2"
                    >
                      <ArrowRight className="w-4 h-4" />
                      <Label className="text-sm">{item.title}</Label>
                    </CommandItem>
                  ))}
                </CommandGroup>
              );
            })}
          </CommandList>
        </Command>
        <DialogFooter className="w-full bg-accent">
          <div className="w-full p-2 text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Kbd>Enter</Kbd>
              <Label className="text-xs">Go to Page</Label>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

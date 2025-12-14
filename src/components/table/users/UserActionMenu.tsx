"use client";
import React, { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { ChangePasswordDialog } from "./ChangePasswordDialog";
import { Button } from "@/components/ui/button";
import { Ellipsis } from "lucide-react";

export function UserActionMenu({ userId }: { userId: string | number }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size={"sm"}
            variant={"outline"}
            aria-label="Open actions"
            title="Actions"
          >
            <Ellipsis />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem
            onSelect={(e) => {
              // open the dialog when the item is selected
              e.preventDefault();
              setOpen(true);
            }}
          >
            Change password
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ChangePasswordDialog
        userId={String(userId)}
        open={open}
        onOpenChange={(val) => setOpen(val)}
      />
    </>
  );
}

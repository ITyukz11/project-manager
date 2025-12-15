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
import { Ellipsis, Lock, Pencil, ToggleLeft, Trash } from "lucide-react";

export function UserActionMenu({
  userId,
  isUserNetwork,
}: {
  userId: string | number;
  isUserNetwork?: boolean;
}) {
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
          {!isUserNetwork && (
            <>
              <DropdownMenuItem
                onSelect={(e) => {
                  // open the dialog when the item is selected
                  e.preventDefault();
                  setOpen(true);
                }}
              >
                <Lock /> Change password
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <Pencil /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <ToggleLeft /> Deactivate
              </DropdownMenuItem>
            </>
          )}

          <DropdownMenuItem disabled variant="destructive">
            <Trash /> Delete
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

"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { ADMINROLES } from "@/lib/types/role";
import GroupChatManagerTab from "../(tabs)/gc-manager/GroupChatManagerTab";
import { NetworkGroupChatFormDialog } from "../(components)/NetworkGroupChatFormDialog";
import { Plus } from "lucide-react";

export default function GroupChatManagerPage() {
  const [createGroupChatDialogOpen, setCreateGroupChatDialogOpen] =
    useState(false);
  const { data } = useSession();

  return (
    <>
      {data?.user?.role === ADMINROLES.ADMIN ||
      data?.user?.role === ADMINROLES.SUPERADMIN ||
      data?.user?.role === ADMINROLES.TL ? (
        <div className="flex justify-end">
          <Button onClick={() => setCreateGroupChatDialogOpen(true)}>
            <Plus />
            Create GC
          </Button>
        </div>
      ) : null}
      <GroupChatManagerTab />
      <NetworkGroupChatFormDialog
        open={createGroupChatDialogOpen}
        onOpenChange={setCreateGroupChatDialogOpen}
      />
    </>
  );
}

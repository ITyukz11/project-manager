"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { ADMINROLES } from "@/lib/types/role";
import NetworkDetailsTab from "../(tabs)/accounts/NetworkDetailsTab";
import { NetworkUserFormDialog } from "../(components)/NetworkAccountFormDialog";
import { Plus } from "lucide-react";

export default function AccountPage() {
  const [createUserDialogOpen, setCreateUserDialogOpen] = useState(false);
  const { data } = useSession();

  return (
    <>
      {data?.user?.role === ADMINROLES.ADMIN ||
      data?.user?.role === ADMINROLES.SUPERADMIN ||
      data?.user?.role === ADMINROLES.TL ? (
        <div className="flex justify-end">
          <Button onClick={() => setCreateUserDialogOpen(true)}>
            <Plus />
            Create Account
          </Button>
        </div>
      ) : null}
      <NetworkDetailsTab />
      <NetworkUserFormDialog
        open={createUserDialogOpen}
        onOpenChange={setCreateUserDialogOpen}
      />
    </>
  );
}

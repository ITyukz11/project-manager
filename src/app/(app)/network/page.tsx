"use client";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useMemo, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ROLES } from "@/lib/types/role";
import NetworkDetailsTab from "./(tabs)/accounts/NetworkDetailsTab";
import { NetworkUserFormDialog } from "./(components)/NetworkAccountFormDialog";
import GroupChatManagerTab from "./(tabs)/gc-manager/GroupChatManagerTab";
import { NetworkGroupChatFormDialog } from "./(components)/NetworkGroupChatFormDialog";

export default function EditBetEventPage() {
  const { data } = useSession();
  const router = useRouter();
  const [createUserDialogOpen, setCreateUserDialogOpen] = useState(false);
  const [createGroupChatDialogOpen, setCreateGroupChatDialogOpen] =
    useState(false);
  const [tab, setTab] = useState("account");

  const TAB_OPTIONS = useMemo(
    () => [
      { value: "account", label: "Accounts", disabled: false },
      {
        value: "group-chat-manager",
        label: "Group Chat Manager",
      },
    ],
    []
  );

  return (
    <Card>
      <CardHeader className="flex flex-col">
        <CardTitle>
          <h1 className="text-3xl font-bold">Network</h1>
        </CardTitle>
        <span className="text-muted-foreground text-sm">
          Manage your network accounts and group chat configurations here.
        </span>
        <div className="flex justify-between flex-row w-full">
          <div
            className="flex flex-row hover:underline text-sm text-primary cursor-pointer mt-2 items-center gap-1"
            onClick={() => router.back()}
          >
            <ArrowLeft />
            Back
          </div>
          {(data?.user?.role === ROLES.ADMIN ||
            data?.user?.role === ROLES.TL) &&
            (tab === "account" ? (
              <Button onClick={() => setCreateUserDialogOpen(true)}>
                Create Account
              </Button>
            ) : (
              <Button onClick={() => setCreateGroupChatDialogOpen(true)}>
                Create GC
              </Button>
            ))}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={tab} onValueChange={setTab} defaultValue="account">
          {/* Desktop Tabs Navigation */}
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0 flex-wrap hidden md:flex">
            {TAB_OPTIONS.map((opt) => (
              <TabsTrigger
                key={opt.value}
                value={opt.value}
                disabled={opt.disabled}
                className={cn(
                  "cursor-pointer w-full md:w-auto justify-center relative after:absolute after:inset-x-0 after:bottom-0 after:h-0.5",
                  " hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary text-sm p-2"
                )}
              >
                {opt.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Mobile Select Navigation */}
          <div className="block md:hidden mb-2 space-y-2">
            <Label>Select Tab</Label>
            <Select value={tab} onValueChange={setTab}>
              <SelectTrigger className="w-fit">
                <SelectValue placeholder="Select Tab" />
              </SelectTrigger>
              <SelectContent>
                {TAB_OPTIONS.map((opt) => (
                  <SelectItem
                    key={opt.value}
                    value={opt.value}
                    disabled={opt.disabled}
                  >
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tab Content */}
          <TabsContent value="account" className="pt-4">
            <NetworkDetailsTab />
          </TabsContent>
          <TabsContent value="group-chat-manager" className="pt-4">
            <GroupChatManagerTab />
          </TabsContent>
        </Tabs>
      </CardContent>
      <NetworkUserFormDialog
        open={createUserDialogOpen}
        onOpenChange={setCreateUserDialogOpen}
      />
      <NetworkGroupChatFormDialog
        open={createGroupChatDialogOpen}
        onOpenChange={setCreateGroupChatDialogOpen}
      />
    </Card>
  );
}

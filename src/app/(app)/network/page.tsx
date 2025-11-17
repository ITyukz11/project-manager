"use client";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

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
import { useUsersNetwork } from "@/lib/hooks/swr/network/useUserNetwork";
import { useSession } from "next-auth/react";

// Type for form values

export default function EditBetEventPage() {
  const {
    usersDataNetwork,
    usersLoadingNetwork,
    usersErrorNetwork,
    refetchUsersNetwork,
  } = useUsersNetwork();

  const { data } = useSession();
  const router = useRouter();
  const params = useParams();
  const { id } = params as { id: string };

  const [tab, setTab] = useState("account");

  const TAB_OPTIONS = useMemo(
    () => [
      { value: "account", label: "Details", disabled: false },
      {
        value: "group-chat-manager",
        label: "Group Chat Manager",
      },
    ],
    []
  );

  console.log("data:", data);
  return (
    <Card>
      <CardHeader className="flex flex-col">
        <CardTitle>
          <h1 className="text-3xl font-bold">Network</h1>
        </CardTitle>
        <span className="text-muted-foreground text-sm">
          Manage your network accounts and settings here.
        </span>
        <div
          className="flex flex-row hover:underline text-sm text-primary cursor-pointer mt-2 items-center gap-1"
          onClick={() => router.back()}
        >
          <ArrowLeft />
          Back
        </div>
      </CardHeader>
      <CardContent>
        {usersLoadingNetwork ? (
          <Skeleton className="h-32 w-full mb-4" />
        ) : (
          <Tabs value={tab} onValueChange={setTab} defaultValue="account">
            {/* Desktop Tabs Navigation */}
            <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0 flex-wrap hidden md:flex">
              {TAB_OPTIONS.map((opt) => (
                <TabsTrigger
                  key={opt.value}
                  value={opt.value}
                  disabled={opt.disabled}
                  className="dark:hover:text-white cursor-pointer hover:border-b-primary/30 hover:text-black flex items-center gap-2 relative rounded-none rounded-t-md border-b-2 border-b-transparent bg-transparent px-4 pb-1 pt-2 font-semibold text-muted-foreground shadow-none transition-none focus-visible:ring-0 data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
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
              {/* <EventDetailsTab betEvent={betEvent} refreshBetEvents={mutate} /> */}
            </TabsContent>
            <TabsContent value="g" className="pt-4">
              {/* <ConfigurationTab
                configuration={betEvent?.configuration}
                eventId={betEvent?.id}
              /> */}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}

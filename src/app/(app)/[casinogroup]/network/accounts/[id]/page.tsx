"use client";

import { DataTable } from "@/components/table/data-table";
import { getUserNetworkColumns } from "@/components/table/network/getUserNetworkColumns";
import { networkGCManagerColumn } from "@/components/table/network/networkGCManagerColumn";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useGroupChatsByUserId } from "@/lib/hooks/swr/network/useGroupChatsByUserId";
import { useUserReferralsByUserId } from "@/lib/hooks/swr/network/useUserReferralsByUserId";
import { ArrowLeft, Plus, TriangleAlert } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { NetworkUserFormDialog } from "../../(components)/NetworkAccountFormDialog";

const Page = () => {
  const router = useRouter();
  const [tab, setTab] = useState<string>("group-chats");
  const params = useParams();
  const casinoGroup = params.casinogroup?.toLocaleString();
  const id = params.id;
  const { groupChats, isLoading, error } = useGroupChatsByUserId(
    Array.isArray(id) ? id[0] : id
  );
  const {
    referrals,
    isLoading: isLoadingReferrals,
    error: errorReferrals,
    mutate: mutateReferrals,
  } = useUserReferralsByUserId(Array.isArray(id) ? id[0] : id, casinoGroup);

  const [networkUserFormDialogOpen, setNetworkUserFormDialogOpen] =
    useState(false);

  const hiddenColumns = ["createdAt"];

  const TAB_OPTIONS = [
    {
      label: "Group Chats",
      value: "group-chats",
      disabled: false,
      count: groupChats?.length ?? 0,
      loading: isLoading,
    },
    {
      label: "Referrals",
      value: "referrals",
      disabled: false,
      count: referrals?.length ?? 0,
      loading: isLoadingReferrals,
    },
  ];
  return (
    <div>
      <div className="flex flex-col gap-4">
        {/* Left Back Navigation & Info */}
        <div className="flex items-center gap-2">
          <button
            className="flex items-center gap-1 text-sm text-primary hover:underline cursor-pointer"
            onClick={() => router.back()}
          >
            <ArrowLeft />
            Back
          </button>
          {groupChats && <Label className="text-md font-semibold">{id}</Label>}
        </div>
        <Tabs value={tab} onValueChange={setTab} defaultValue="details">
          <div className="w-full justify-between flex">
            <TabsList>
              {TAB_OPTIONS.map((opt) => (
                <TabsTrigger
                  key={opt.value}
                  value={opt.value}
                  disabled={opt.disabled}
                  className="cursor-pointer"
                >
                  {opt.label}
                  {opt.loading ? (
                    <Skeleton className="h-4 w-4" />
                  ) : (
                    <Badge
                      variant="secondary"
                      className="ml-2 px-1 py-0 text-xs rounded-full"
                    >
                      {opt.count}
                    </Badge>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
            {tab === "referrals" ? (
              <Button onClick={() => setNetworkUserFormDialogOpen(true)}>
                <Plus />
                Add Referrals
              </Button>
            ) : null}
          </div>
          {/* Desktop Tabs Navigation */}

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
          <TabsContent value="group-chats">
            {/* Right Error Indicator */}
            {error && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <TriangleAlert className="text-red-500" />
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  sideOffset={6}
                  className="max-w-xs"
                >
                  <div className="text-sm text-red-400 dark:text-red-700">
                    {error.message ??
                      "Error loading accounts. Please try again later."}
                  </div>
                </TooltipContent>
              </Tooltip>
            )}
            {/* Table */}
            {isLoading ? (
              <div className="w-full flex flex-col gap-2 items-center">
                <Skeleton className="w-full h-10" />
                <Skeleton className="w-full h-40" />
              </div>
            ) : (
              <DataTable
                data={groupChats ?? []}
                columns={networkGCManagerColumn}
                allowSelectRow={false}
                hiddenColumns={hiddenColumns}
                cursorRowSelect={false}
                allowExportData={true}
              />
            )}
          </TabsContent>
          <TabsContent value="referrals">
            {/* Right Error Indicator */}
            {errorReferrals && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <TriangleAlert className="text-red-500" />
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  sideOffset={6}
                  className="max-w-xs"
                >
                  <div className="text-sm text-red-400 dark:text-red-700">
                    {error.message ??
                      "Error loading accounts. Please try again later."}
                  </div>
                </TooltipContent>
              </Tooltip>
            )}

            {/* Table */}
            {isLoadingReferrals ? (
              <div className="w-full flex flex-col gap-2 items-center">
                <Skeleton className="w-full h-10" />
                <Skeleton className="w-full h-40" />
              </div>
            ) : (
              <DataTable
                data={referrals ?? []}
                columns={getUserNetworkColumns({
                  casinoGroup: casinoGroup?.toLocaleString() ?? "",
                })}
                allowSelectRow={false}
                hiddenColumns={hiddenColumns}
                cursorRowSelect={false}
                allowExportData={true}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
      <NetworkUserFormDialog
        open={networkUserFormDialogOpen}
        onOpenChange={() =>
          setNetworkUserFormDialogOpen(!networkUserFormDialogOpen)
        }
        referredByUsername={id as string}
        mutate={mutateReferrals}
      />
    </div>
  );
};

export default Page;

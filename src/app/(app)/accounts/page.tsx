"use client";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { DataTable } from "@/components/table/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Plus, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { userColumns } from "@/components/table/users/userColumn";
import { useUsers } from "@/lib/hooks/swr/user/useUsersData";

export default function SettingsAccountPage() {
  const { usersData, usersLoading, usersError } = useUsers();
  const hiddenColumns = ["color"];

  // Advanced Filter Sheet UI
  return (
    <Card>
      <CardContent>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Accounts</h1>

          <div className="flex flex-row gap-2 items-center">
            {usersError && (
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
                    {usersError?.message ||
                      "Error loading accounts. Please try again later."}
                  </div>
                </TooltipContent>
              </Tooltip>
            )}
            <Button>
              <Plus />
              Add Account
            </Button>
          </div>
        </div>
        <Separator />

        {/* Table */}
        {usersLoading ? (
          <div className="w-full flex flex-col gap-2 items-center">
            <Skeleton className="w-full h-10" />
            <Skeleton className="w-full h-40" />
          </div>
        ) : usersError ? (
          <div className="p-4 bg-red-50 text-red-700 rounded-md border border-red-200">
            <Label>Error: {usersError.message}</Label>
          </div>
        ) : !usersData ? (
          <div className="w-full flex flex-col gap-2 items-center">
            <Skeleton className="w-full h-10" />
            <Skeleton className="w-full h-40" />
          </div>
        ) : (
          <DataTable
            data={usersData}
            columns={userColumns}
            allowSelectRow={false}
            hiddenColumns={hiddenColumns}
            cursorRowSelect={false}
            allowExportData={true}
          />
        )}
      </CardContent>
    </Card>
  );
}

"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable } from "@/components/table/data-table";
import { useSession } from "next-auth/react";
import { RefreshCw, TriangleAlert, Users, Radio } from "lucide-react";
import { currentOnlineColumns } from "@/components/table/users/currently-online/current-online-columns";
import { useOnlineUsers } from "@/lib/hooks/swr/user/useOnlineUsers";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ADMINROLES } from "@/lib/types/role";

export default function OnlineUsersPage() {
  const { data: session } = useSession();
  const isAdmin =
    session?.user?.role === ADMINROLES.SUPERADMIN ||
    session?.user?.role === ADMINROLES.ADMIN;
  const {
    onlineUsers,
    onlineUsersCount,
    isLoading,
    error,
    lastUpdate,
    refetch,
  } = useOnlineUsers(isAdmin);

  // Customize columns to hide if needed
  const hiddenColumns: string[] = [];

  console.log("session:", session);

  return (
    <Card>
      <CardContent>
        {/* Header Section - Mobile Responsive */}
        <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between">
          {/* Title Section */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg shrink-0">
              <Users className="h-5 w-5 md:h-6 md:w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl md:text-3xl font-bold truncate">
                Currently Online
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground mt-1">
                Real-time user presence tracking
              </p>
            </div>
          </div>

          {/* Actions Section */}
          <div className="flex items-center gap-2 md:gap-3 flex-wrap">
            {/* Online Count Badge */}
            {!isLoading && (
              <Badge
                variant="outline"
                className="px-2 md:px-3 py-1 text-xs md:text-sm font-medium border-green-500 text-green-700 dark:text-green-400 shrink-0"
              >
                <span className="relative flex h-2 w-2 mr-1.5 md:mr-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="hidden sm:inline">
                  {onlineUsersCount} {onlineUsersCount === 1 ? "user" : "users"}{" "}
                  online
                </span>
                <span className="sm:hidden">{onlineUsersCount}</span>
              </Badge>
            )}

            {/* Real-time Indicator */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 px-2 py-1 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-800 shrink-0">
                  <Radio className="h-3 w-3 text-green-500 animate-pulse" />
                  <span className="text-xs font-medium text-green-700 dark:text-green-400">
                    Live
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <div className="text-xs">
                  <p className="font-medium">Real-time updates via Pusher</p>
                  <p className="text-muted-foreground mt-1">
                    Last update: {lastUpdate.toLocaleTimeString()}
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>

            {/* Error Indicator */}
            {error && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <TriangleAlert className="h-4 w-4 md:h-5 md:w-5 text-red-500 cursor-pointer shrink-0" />
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  sideOffset={6}
                  className="max-w-xs"
                >
                  <div className="text-sm text-red-500">
                    {error?.message ||
                      "Error loading online users. Please try again. "}
                  </div>
                </TooltipContent>
              </Tooltip>
            )}

            {/* Manual Refresh Button */}
            <Button
              onClick={() => refetch()}
              disabled={isLoading}
              variant="outline"
              size="sm"
              className="gap-1.5 md:gap-2 shrink-0"
            >
              <RefreshCw className="h-3.5 w-3.5 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-4 md:mb-6">
            <TriangleAlert className="h-4 w-4" />
            <AlertDescription className="text-sm">
              {error?.message ||
                "Failed to load online users.  Please try refreshing the page."}
            </AlertDescription>
          </Alert>
        )}

        {/* Real-time Status Banner */}
        {!isLoading && !error && (
          <div className="p-2.5 md:p-3 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-xs text-green-700 dark:text-green-400 flex items-start md:items-center gap-2">
              <Radio className="h-3 w-3 animate-pulse mt-0.5 md:mt-0 shrink-0" />
              <span className="leading-relaxed">
                <span className="hidden sm:inline">
                  Real-time updates enabled • Updates appear instantly when
                  users clock in/out
                </span>
                <span className="sm:hidden">Real-time updates enabled</span>
              </span>
            </p>
          </div>
        )}

        {/* Table/List */}
        {isLoading ? (
          <div className="w-full flex flex-col gap-2">
            <Skeleton className="w-full h-10 md:h-12" />
            <Skeleton className="w-full h-48 md:h-64" />
            <Skeleton className="w-full h-12 md:h-16" />
          </div>
        ) : onlineUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 md:py-12 text-center px-4">
            <div className="p-3 md:p-4 bg-muted rounded-full mb-3 md:mb-4">
              <Users className="h-6 w-6 md:h-8 md:w-8 text-muted-foreground" />
            </div>
            <h3 className="text-base md:text-lg font-semibold mb-2">
              No users online
            </h3>
            <p className="text-xs md:text-sm text-muted-foreground max-w-sm">
              There are currently no users clocked in. Updates will appear
              automatically when users clock in.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-4 md:mx-0">
            <div className="min-w-full inline-block align-middle">
              <DataTable
                data={onlineUsers}
                columns={currentOnlineColumns}
                allowSelectRow={false}
                hiddenColumns={hiddenColumns}
                cursorRowSelect
                allowExportData={true}
                onViewRowId={(id) => {
                  window.location.href = `/users/${id}`;
                }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

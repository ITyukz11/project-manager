"use client";
import React from "react";
import { useRouter, useParams, notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserById } from "@/lib/hooks/swr/user/useUserById";
import { UserDetailsTab } from "./details/UserDetailsTab";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Label } from "@/components/ui/label";
import { UserAttendanceTab } from "./attendance/page";
// Import your tab components
// (Optional) import for userError display

export default function UserInformationPage() {
  const router = useRouter();
  const params = useParams();

  // Get userId from the dynamic route
  const userId =
    typeof params?.id === "string"
      ? params.id
      : Array.isArray(params.id)
      ? params.id[0]
      : "";

  // Fetch the user by id
  const { userData, userError, userLoading, mutate } = useUserById(userId);

  // Show "not found" if not loading and user not found
  if (!userLoading && !userData) {
    notFound();
  }

  return (
    <Card>
      <CardHeader className="flex flex-col">
        <CardTitle className="flex-wrap">
          <h1 className="text-xl md:text-3xl font-bold">
            {userData?.name} Account Details
          </h1>
        </CardTitle>
        <span className="text-muted-foreground text-sm">
          Edit / View account details
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-2 "
          onClick={() => router.back()}
        >
          <ArrowLeft size={16} className="md:h-5 md:w-5" />
          <span className="text-sm md:text-base">Back</span>
        </Button>
      </CardHeader>

      <CardContent>
        {userLoading ? (
          <Skeleton className="h-32 w-full mb-4" />
        ) : userError ? (
          <Label className="text-destructive">
            Failed to load user. Please try again later.
          </Label>
        ) : (
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
              <TabsTrigger
                value="details"
                className="cursor-pointer hover:border-b-primary/30 hover:text-black flex items-center gap-2 relative rounded-none rounded-t-md border-b-2 border-b-transparent bg-transparent px-4 pb-1 pt-2 font-semibold text-muted-foreground shadow-none transition-none focus-visible:ring-0 data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                Details
              </TabsTrigger>
              <TabsTrigger
                value="attendance"
                className="cursor-pointer hover:border-b-primary/30 hover:text-black flex items-center gap-2 relative rounded-none rounded-t-md border-b-2 border-b-transparent bg-transparent px-4 pb-1 pt-2 font-semibold text-muted-foreground shadow-none transition-none focus-visible:ring-0 data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                Attendance
              </TabsTrigger>
            </TabsList>
            <TabsContent value="details" className="pb-6">
              {/* Pass the user data and mutate function */}
              <UserDetailsTab
                user={userData}
                isLoading={userLoading}
                isError={!!userError}
                mutateUser={mutate}
              />
            </TabsContent>
            <TabsContent value="attendance">
              <UserAttendanceTab />
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}

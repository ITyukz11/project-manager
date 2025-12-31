"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { GlobalFormField } from "@/components/common/form";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { UserWithCasinoGroups } from "@/components/table/users/userColumn";
import { useCasinoGroup } from "@/lib/hooks/swr/casino-group/useCasinoGroup";
import { Input } from "@/components/ui/input";
import { useUsers } from "@/lib/hooks/swr/user/useUsersData";

const EditAccountSchema = z.object({
  name: z.string().min(1, "Name is required"),
  username: z.string().min(1, "Username is required"),
  email: z.union([z.literal(""), z.string().email()]),
  casinoGroupId: z.array(z.string()).optional(),
  messengerLink: z.string().optional(),
  role: z.string().optional(),
  password: z.string().optional(),
});

type EditAccountDialogValues = z.infer<typeof EditAccountSchema>;

type UserDetailsTabProps = {
  user: UserWithCasinoGroups | undefined;
  isLoading?: boolean;
  isError?: boolean;
  mutateUser?: () => void;
};

export function UserDetailsTab({
  user,
  isLoading,
  isError,
  mutateUser,
}: UserDetailsTabProps) {
  const [loading, setLoading] = useState(false);
  const { refetchUsers } = useUsers();
  const userCasinoGroupIds = user?.casinoGroups?.map((g) => g.id) ?? [];
  const { casinoGroupData, casinoGroupLoading, casinoGroupError } =
    useCasinoGroup();

  const form = useForm<EditAccountDialogValues>({
    resolver: zodResolver(EditAccountSchema),
    defaultValues: {
      name: user?.name ?? "",
      username: user?.username ?? "",
      email: user?.email ?? "",
      messengerLink: user?.messengerLink ?? "",
      role: user?.role ?? "",
      casinoGroupId: userCasinoGroupIds,
      password: "",
    },
  });

  // Reset form when user changes
  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name ?? "",
        username: user.username ?? "",
        email: user.email ?? "",
        messengerLink: user.messengerLink ?? "",
        role: user.role ?? "",
        casinoGroupId: userCasinoGroupIds,
      });
    }
    // eslint-disable-next-line
  }, [user]);

  async function handleSubmit(values: EditAccountDialogValues) {
    setLoading(true);
    try {
      const { casinoGroupId, ...rest } = values;
      const updateData: any = { ...rest, casinoGroupId };

      const res = await fetch(`/api/user/${user?.id}`, {
        method: "PATCH",
        body: JSON.stringify(updateData),
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data?.error || "Failed to update account.");
        return;
      }

      toast.success("Account updated successfully!");
      mutateUser?.(); //refresh this user details
      refetchUsers(); // refetch all user list
    } catch (err: any) {
      toast.error(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  if (isLoading) {
    return <Spinner />;
  }

  if (isError || !user) {
    return (
      <div className="text-red-500">
        Could not load user details. Please try again later.
      </div>
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-6"
        autoComplete="off"
      >
        <div className="flex flex-col gap-4 md:w-[400px]">
          <GlobalFormField
            form={form}
            fieldName="name"
            label="Name"
            required
            type="text"
            placeholder="Enter name"
          />
          <GlobalFormField
            form={form}
            fieldName="username"
            label="Username"
            required
            type="text"
            placeholder="Enter username"
          />
          <GlobalFormField
            form={form}
            fieldName="role"
            label="Account Type"
            required
            type="select"
            options={["ADMIN", "TL", "LOADER", "ACCOUNTING"].map((role) => ({
              label: role,
              value: role,
            }))}
            placeholder="Enter account type"
          />
          <GlobalFormField
            form={form}
            fieldName="messengerLink"
            label="Messenger Link"
            required={false}
            type="text"
            placeholder="Enter messenger link"
          />
          <GlobalFormField
            form={form}
            fieldName="email"
            label="Email"
            required
            type="text"
            placeholder="Enter email"
          />
          {casinoGroupError ? (
            <div className="text-destructive">Error loading casino groups</div>
          ) : (
            <GlobalFormField
              form={form}
              type="multiselect"
              fieldName="casinoGroupId"
              label="Casino Group"
              required={false}
              isLoading={casinoGroupLoading || loading}
              items={
                Array.isArray(casinoGroupData)
                  ? casinoGroupData.map((group: any) => ({
                      label: group.name,
                      value: group.id,
                    }))
                  : []
              }
              placeholder="Select a casino group"
            />
          )}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  New Password{" "}
                  <span className="text-gray-500 font-light">(Optional)</span>
                </FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    disabled={loading}
                    placeholder="Enter new password to update"
                    autoComplete="new-password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Spinner /> Saving...
              </>
            ) : (
              "Update"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

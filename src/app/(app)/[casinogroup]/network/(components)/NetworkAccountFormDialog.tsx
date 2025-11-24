"use client";

import * as React from "react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { GlobalFormField } from "@/components/common/form";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { NETWORKROLES } from "@/lib/types/role";
import { useGroupChats } from "@/lib/hooks/swr/network/useGroupChat";
import { useUsersNetwork } from "@/lib/hooks/swr/network/useUserNetwork";
import RequiredField from "@/components/common/required-field";
import { Input } from "@/components/ui/input";
import { useParams, usePathname } from "next/navigation";
import { useCasinoGroup } from "@/lib/hooks/swr/casino-group/useCasinoGroup";
import { useCasinoGroupNetwork } from "@/lib/hooks/swr/casino-group/useCasinoGroupNetwork";
import { Label } from "@/components/ui/label";

// Add "groupChats" to your Zod Schema
const NetworkUserFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  messengerLink: z.string().optional(),
  role: z.enum(Object.values(NETWORKROLES), {
    message: "Role is required",
  }),
  casinoGroups: z.array(z.string()).optional(),
  groupChats: z.array(z.string()).optional(), // groupChat IDs as strings
});

export type NetworkUserFormDialogValues = z.infer<typeof NetworkUserFormSchema>;

export function NetworkUserFormDialog({ open, onOpenChange }) {
  const [loading, setLoading] = React.useState(false);
  const { groupChatsData, groupChatsLoading } = useGroupChats();

  const params = useParams();
  const casinoGroup = params.casinogroup;
  const { refetchUsersNetwork } = useUsersNetwork();
  const { refetchUsersNetwork: refetchUsersNetworkByGroup } = useUsersNetwork(
    casinoGroup?.toLocaleString()
  );
  const { casinoGroupNetworkData, casinoGroupNetworkLoading } =
    useCasinoGroupNetwork(casinoGroup?.toLocaleString() ?? "");

  const form = useForm<NetworkUserFormDialogValues>({
    resolver: zodResolver(NetworkUserFormSchema),
    defaultValues: {
      name: "",
      email: "",
      username: "",
      password: "",
      messengerLink: "",
      role: undefined,
      groupChats: [],
      casinoGroups: [],
    },
  });

  React.useEffect(() => {
    form.reset();
  }, [form, open]);

  async function handleSubmit(values: NetworkUserFormDialogValues) {
    setLoading(true);
    try {
      const finalValues = {
        ...values,
        casinoGroups: [casinoGroupNetworkData?.id], // <-- must be array of at least 1 string!
      };
      const res = await fetch("/api/network/users", {
        method: "POST",
        body: JSON.stringify(finalValues),
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || "Failed to create network user.");
        return;
      }
      toast.success("Network user created successfully!");
      refetchUsersNetwork();
      refetchUsersNetworkByGroup();
      onOpenChange?.(false);
      form.reset();
    } catch (err: any) {
      toast.error(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }
  console.log("casinoGroupNetworkData: ", casinoGroupNetworkData);
  console.log("form errors:", form.formState.errors);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>New Network User</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6 "
            autoComplete="off"
          >
            <div className="grid grid-cols-2 gap-4">
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
                fieldName="email"
                label="Email"
                required
                type="text"
                placeholder="Enter email"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <GlobalFormField
                form={form}
                fieldName="username"
                label="Username"
                required
                type="text"
                placeholder="Enter username (optional)"
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Password <RequiredField />
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter password"
                        type="password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <GlobalFormField
              form={form}
              fieldName="role"
              label="Role"
              required
              type="select"
              options={Object.values(NETWORKROLES).map((type) => ({
                label: type,
                value: type,
              }))}
              placeholder="Select user type"
            />
            <GlobalFormField
              form={form}
              fieldName="groupChats"
              label="Add Group Chats"
              required={false}
              type="multiselect"
              items={
                groupChatsLoading
                  ? []
                  : groupChatsData?.map((chat) => ({
                      label: chat.name,
                      value: chat.id,
                    })) || []
              }
              placeholder={
                groupChatsLoading
                  ? "Loading..."
                  : "Select group chats (optional)"
              }
            />
            <GlobalFormField
              form={form}
              fieldName="messengerLink"
              label="Messenger Link"
              required={false}
              type="text"
              placeholder="Enter messenger link (optional)"
            />
            <DialogFooter>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Spinner /> Submitting...
                  </>
                ) : (
                  "Submit"
                )}
              </Button>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={loading}>
                  Cancel
                </Button>
              </DialogClose>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

"use client";
import { useCashoutById } from "@/lib/hooks/swr/cashout/useCashoutById";
import { ArrowLeft, Paperclip, Send, Upload, UserCircle } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { formatDate } from "date-fns";
import { Label } from "@/components/ui/label";
import { useUsersNetwork } from "@/lib/hooks/swr/network/useUserNetwork";
import { toast } from "sonner";
import { ADMINROLES } from "@/lib/types/role";
import {
  Mention,
  MentionContent,
  MentionInput,
  MentionItem,
} from "@/components/ui/mention";
import { Textarea } from "@/components/ui/textarea";
import { formatAmountWithDecimals } from "@/components/formatAmount";
import { useSession } from "next-auth/react";
import { UpdateStatusDialog } from "../(components)/UpdateStatusDialog";
import { Skeleton } from "@/components/ui/skeleton";

export default function Page() {
  const { id } = useParams();
  const router = useRouter();
  const { cashout, isLoading, error, mutate } = useCashoutById(id as string);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { usersDataNetwork } = useUsersNetwork();
  const { data: session } = useSession();

  console.log("cashout: ", cashout);
  console.log("usersDataNetwork: ", usersDataNetwork);
  console.log("comment: ", comment);
  async function handleCommentSend(e: React.FormEvent) {
    e.preventDefault();
    if (!comment.trim()) return;
    setSubmitting(true);
    try {
      await fetch(`/api/cashout/${id}/thread`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: comment }),
      });
      setComment("");
      mutate();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <Button
        variant="ghost"
        className="flex items-center gap-2"
        onClick={() => router.back()}
      >
        <ArrowLeft size={18} /> Back
      </Button>
      {session?.user?.role === "ADMIN" && (
        <UpdateStatusDialog cashoutId={id} currentStatus={cashout?.status} />
      )}
      <ResizablePanelGroup
        direction="horizontal"
        className="min-h-[340px] h-[calc(100vh-160px)] rounded-lg overflow-hidden border-0"
      >
        {/* Left: Details */}
        <ResizablePanel
          defaultSize={50}
          minSize={35}
          className="flex flex-col justify-between"
        >
          {isLoading ? (
            <div className="flex flex-col gap-3 my-4 mr-4">
              <div className="grid grid-cols-2 gap-2">
                <Skeleton className="w-full h-10 rounded" />
                <Skeleton className="w-full h-10 rounded" />
                <Skeleton className="w-full h-10 rounded" />
                <Skeleton className="w-full h-10 rounded" />

                <Skeleton className="w-full h-10 rounded" />

                <Skeleton className="w-full h-10 rounded" />
                <Skeleton className="w-full h-10 rounded" />

                <Skeleton className="w-full h-10 rounded" />
                <Skeleton className="w-full h-10 rounded" />

                <Skeleton className="w-full h-10 rounded" />
                <Skeleton className="w-full h-10 rounded" />

                <Skeleton className="w-full h-10 rounded" />
              </div>
            </div>
          ) : error ? (
            <div className="text-sm text-red-600">Error: {error.message}</div>
          ) : cashout ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
              {/* Status and Amount */}
              <div>
                <span className="text-muted-foreground text-xs mb-1 block">
                  Status
                </span>
                <Badge
                  className={`capitalize text-xs cursor-pointer ${
                    cashout.status === "PENDING"
                      ? "bg-yellow-400 text-black"
                      : cashout.status === "COMPLETED"
                      ? "bg-green-600 text-white"
                      : "bg-red-600 text-white"
                  }`}
                >
                  {cashout.status}
                </Badge>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs mb-1 block">
                  Amount
                </Label>
                <div className="font-mono">
                  {formatAmountWithDecimals(cashout.amount)}
                </div>
              </div>

              {/* Username and Bank/E-wallet */}
              <div>
                <Label className="text-muted-foreground text-xs mb-1 block">
                  Username
                </Label>
                <Label>{cashout.userName}</Label>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs mb-1 block">
                  Bank / E-wallet
                </Label>
                <Label className="font-medium">{cashout.bankName}</Label>
              </div>

              {/* Account Name and Account Number */}
              <div>
                <Label className="text-muted-foreground text-xs mb-1 block">
                  Account Name
                </Label>
                <Label>{cashout.accName}</Label>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs mb-1 block">
                  Account Number
                </Label>
                <Label>{cashout.accNumber}</Label>
              </div>

              {/* Entry By and Agent Tip */}
              <div>
                <Label className="text-muted-foreground text-xs mb-1 block">
                  Entry By
                </Label>
                <Label className="font-mono">
                  {cashout.user?.name || (
                    <span className="text-muted-foreground">—</span>
                  )}
                </Label>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs mb-1 block">
                  Agent Tip
                </Label>
                <Label className="font-mono">
                  {formatAmountWithDecimals(cashout.agentTip)}
                </Label>
              </div>

              {/* MA Tip and Loader Tip */}
              <div>
                <Label className="text-muted-foreground text-xs mb-1 block">
                  MA Tip
                </Label>
                <Label className="font-mono">
                  {formatAmountWithDecimals(cashout.masterAgentTip)}
                </Label>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs mb-1 block">
                  Loader Tip
                </Label>
                <Label className="font-mono">
                  {formatAmountWithDecimals(cashout.loaderTip)}
                </Label>
              </div>

              {/* Attachments and Requested At */}
              <div>
                <Label className="text-muted-foreground text-xs mb-1 block">
                  Attachments
                </Label>
                <ul className="mt-1 space-y-1">
                  {Array.isArray(cashout.attachments) &&
                    cashout.attachments.length === 0 && (
                      <li className="text-xs text-muted-foreground">
                        No attachments
                      </li>
                    )}
                  {Array.isArray(cashout.attachments) &&
                    cashout.attachments.map((att) => (
                      <li key={att.id} className="flex items-center gap-1">
                        <Paperclip
                          size={16}
                          className="text-muted-foreground"
                        />
                        <a
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-700 hover:underline text-xs"
                        >
                          {att.filename ?? att.url}
                        </a>
                      </li>
                    ))}
                </ul>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs mb-1 block">
                  Requested At
                </Label>
                <Label>
                  {cashout.createdAt
                    ? formatDate(
                        cashout.createdAt,
                        "MMMM dd, yyyy 'at' hh:mm a"
                      )
                    : "—"}
                </Label>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              No cashout found.
            </div>
          )}
        </ResizablePanel>
        <ResizableHandle />
        {/* Right: Comments / Threads */}
        <ResizablePanel
          defaultSize={50}
          minSize={35}
          className="px-6 pb-2 flex flex-col"
        >
          <div className="flex flex-col h-full">
            <div className="mb-4 text-xl font-semibold text-foreground">
              Comments
            </div>
            <ScrollArea className="flex-1 min-h-[200px] max-h-[calc(100vh-300px)] pr-2">
              {!isLoading && cashout && cashout.cashoutThreads.length === 0 && (
                <div className="flex flex-col h-full text-muted-foreground text-sm">
                  <span className="italic">
                    No comments yet.
                    <br />
                  </span>
                </div>
              )}

              {!isLoading && cashout && cashout.cashoutThreads.length > 0 && (
                <ul className="flex flex-col gap-3">
                  {cashout.cashoutThreads.map((thread) => {
                    const author = thread.author?.name || "—";
                    const role = thread.author?.role;
                    const isUser = session?.user?.id === thread.author?.id;
                    const dateTime = formatDate(
                      thread.createdAt,
                      "MM/dd/yy 'at' hh:mm a"
                    );

                    return (
                      <li
                        key={thread.id}
                        className="flex flex-col items-start overflow-visible px-1 w-full"
                      >
                        <div
                          className={`flex items-end mb-1 w-full ${
                            isUser ? "justify-end" : "justify-start"
                          }`}
                        >
                          {!isUser && (
                            <UserCircle className="text-gray-400 mr-2 w-5 h-5 shrink-0" />
                          )}
                          <div
                            className={`rounded-xl px-4 py-2 text-base max-w-[75%] ${
                              isUser
                                ? "bg-black text-white"
                                : "bg-gray-100 text-gray-900 dark:bg-neutral-900 dark:text-white"
                            }`}
                          >
                            {thread.message}
                          </div>
                        </div>
                        <div
                          className={`w-full flex items-center ${
                            isUser ? "justify-end pr-2" : "justify-start pl-8"
                          }`}
                        >
                          <span className="text-xs text-muted-foreground dark:text-gray-400">
                            {role} &middot; {author} &middot; {dateTime}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </ScrollArea>

            {/* Comment form */}
            <form
              className="flex gap-2 w-full mt-2"
              onSubmit={handleCommentSend}
              autoComplete="off"
            >
              <Mention
                trigger="@"
                className="w-full"
                inputValue={comment}
                onInputValueChange={setComment}
              >
                <MentionInput
                  asChild
                  placeholder="Type @ to mention a user…"
                  disabled={submitting}
                  className="h-20 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                >
                  <Textarea
                    className="resize-none min-h-12 font-sans bg-card text-foreground dark:bg-neutral-900 dark:text-white border border-muted focus:border-blue-500 dark:focus:border-blue-400"
                    rows={5}
                  />
                </MentionInput>
                <MentionContent>
                  {usersDataNetwork.map((user) => (
                    <MentionItem
                      key={user.id}
                      value={user.username}
                      className="flex items-center gap-2 px-2 py-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900"
                    >
                      <span className="font-medium text-sm text-foreground dark:text-blue-200">
                        {user.username}
                      </span>
                      <Label className="text-xs italic text-muted-foreground dark:text-blue-300">
                        {user.role}
                      </Label>
                    </MentionItem>
                  ))}
                </MentionContent>
              </Mention>
              <div className="flex flex-col gap-2">
                <Button>
                  <Upload />
                </Button>
                <Button
                  type="submit"
                  disabled={submitting || !comment.trim()}
                  className="mt-auto"
                >
                  <Send />
                </Button>
              </div>
            </form>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

"use client";
import {
  ArrowLeft,
  Paperclip,
  Radio,
  RefreshCcw,
  UsersRound,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { formatDate } from "date-fns";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { formatAmountWithDecimals } from "@/components/formatAmount";
import { useSession } from "next-auth/react";
import { UpdateStatusDialog } from "../(components)/UpdateStatusDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { ADMINROLES } from "@/lib/types/role";
import {
  getStatusColorClass,
  getStatusIcon,
} from "@/components/getStatusColorClass";
import { useUsers } from "@/lib/hooks/swr/user/useUsersData";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { CashinStatusHistorySheet } from "../(components)/CashinStatusHistorySheet";
import { useCashinById } from "@/lib/hooks/swr/cashin/useCashinById";
import { usePusher } from "@/lib/hooks/use-pusher";
import { CommentsSection } from "@/components/CommentSection";
import { usePusherPresence } from "@/lib/hooks/usePusherPresence";

export default function Page() {
  const { id, casinogroup } = useParams();

  const router = useRouter();
  const { cashin, isLoading, error, mutate } = useCashinById(id as string);
  const [value, setValue] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { usersData } = useUsers(casinogroup?.toLocaleString());
  const { data: session } = useSession();
  const [showStatusSheet, setShowStatusSheet] = useState(false);
  const notificationAudioRef = useRef<HTMLAudioElement | null>(null);

  // Attachments state
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle image paste/drop
  function handlePasteDrop(e: React.ClipboardEvent | React.DragEvent) {
    let files: File[] = [];

    // Paste
    if ("clipboardData" in e && e.clipboardData.files?.length) {
      files = Array.from(e.clipboardData.files);
    }

    // Drop
    if ("dataTransfer" in e && e.dataTransfer.files?.length) {
      files = Array.from(e.dataTransfer.files);
    }

    // Accept only images!
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));
    if (imageFiles.length > 0) {
      setAttachments((prev) => [...prev, ...imageFiles]);

      e.preventDefault();
    }
  }

  // Handle manual file select (via small "upload" button)
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    const images = files.filter((f) => f.type.startsWith("image/"));
    if (images.length > 0) {
      setAttachments((prev) => [...prev, ...images]);
    }
  }

  // Remove single attachment (for preview UI)
  function handleRemoveAttachment(idx: number) {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  }

  console.log("cashinId:", id);

  usePusher({
    channels: [`chatbased-cashin-${id}`],
    eventName: "cashin:thread-updated",
    onEvent: () => {
      mutate(); // 🔥 refetch comments
    },
    audioRef: notificationAudioRef,
  });

  const presenceChannel = id ? `presence-chatbased-cashin-${id}` : "";

  const { members, count, authenticatedCount, guestCount } =
    usePusherPresence(presenceChannel);

  const onlineMembers = Object.values(members);

  const agentMembers = onlineMembers.filter((m) => m.info.type === "auth");

  const guestMembers = onlineMembers.filter((m) => m.info.type === "guest");

  async function handleCommentSend(e: React.FormEvent) {
    e.preventDefault();
    if (!inputValue.trim() && attachments.length === 0) return;
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("message", inputValue);
      if (typeof casinogroup === "string") {
        formData.append("casinoGroup", casinogroup);
      }
      formData.append("mentions", JSON.stringify(value));

      attachments.forEach((file) => formData.append("attachment", file));

      const res = await fetch(`/api/cashin/${id}/thread`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to post comment");
      }

      setInputValue("");
      setValue([]);
      setAttachments([]);
      mutate();
      toast.success("Comment posted!");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  const isAllowed =
    session?.user?.role === ADMINROLES.ADMIN ||
    session?.user?.role === ADMINROLES.SUPERADMIN ||
    session?.user?.role === ADMINROLES.ACCOUNTING;

  console.log("session user role:", session?.user?.role === ADMINROLES.ADMIN);
  // Details Section Component
  const DetailsSection = () => (
    <>
      {isLoading ? (
        <div className="flex flex-col gap-3 my-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="w-full h-10 md:h-12 rounded" />
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="text-sm text-red-600">Error: {error.message}</div>
      ) : cashin ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-y-4 md:gap-x-8">
          {/* Username */}
          <div>
            <Label className="text-muted-foreground text-xs mb-1 block">
              Username
            </Label>
            <Input readOnly value={cashin.userName} className="text-sm" />
          </div>

          {/* Amount */}
          <div>
            <Label className="text-muted-foreground text-xs mb-1 block">
              Amount
            </Label>
            <Input
              readOnly
              value={formatAmountWithDecimals(cashin.amount)}
              className="font-mono text-sm"
            />
          </div>

          {/* Entry By */}
          <div>
            <Label className="text-muted-foreground text-xs mb-1 block">
              Entry By
            </Label>
            <div
              className={cn(
                "flex flex-row gap-1 items-center justify-start overflow-hidden text-sm",
                "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
                "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive"
              )}
            >
              {cashin.transactionRequestId && (
                <span className="relative inline-flex">
                  {/* Ping layer (only when PENDING) */}
                  {cashin.status === "COMPLETED" && (
                    <span className="absolute inset-0 rounded-lg bg-blue-400 opacity-75 animate-pulse">
                      GATEWAY
                    </span>
                  )}

                  {/* Main label */}
                  <span className="relative z-10 rounded-lg bg-blue-100 border border-blue-300 px-2 py-0.5 text-xs font-semibold text-blue-900">
                    GATEWAY
                  </span>
                </span>
              )}

              <Label className="font-normal">{cashin.user?.name}</Label>
            </div>

            {/* <Input readOnly value={cashin.user?.name} className="text-sm" /> */}
          </div>

          {/* Date Requested At */}
          <div>
            <Label className="text-muted-foreground text-xs mb-1 block">
              Date of Request
            </Label>
            <Input
              readOnly
              value={
                cashin.createdAt
                  ? formatDate(cashin.createdAt, "M/dd/yyyy 'at' hh:mm a")
                  : "—"
              }
              className="text-sm"
            />
          </div>

          {/* Details */}
          <div className="md:col-span-1">
            <Label className="text-muted-foreground text-xs mb-1 block">
              Details
            </Label>
            <Textarea
              readOnly
              value={cashin.details}
              className="text-sm min-h-20"
            />
          </div>

          {/* Attachments */}
          <div className="md: col-span-1">
            <Label className="text-muted-foreground text-xs mb-1 block">
              Attachments
            </Label>
            <div className="border rounded-md p-2 min-h-20 bg-muted/20">
              <ul className="space-y-1">
                {Array.isArray(cashin.attachments) &&
                  cashin.attachments.length === 0 && (
                    <li className="text-xs text-muted-foreground italic">
                      No attachments
                    </li>
                  )}
                {Array.isArray(cashin.attachments) &&
                  cashin.attachments.map((att) => (
                    <li key={att.id} className="flex items-center gap-1">
                      <Paperclip size={14} className="text-muted-foreground" />
                      <a
                        href={att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 dark:text-blue-400 hover:underline text-xs truncate"
                      >
                        {att.filename ?? att.url}
                      </a>
                    </li>
                  ))}
              </ul>
            </div>
          </div>

          {/* Status */}
          <div className="md:col-span-2">
            <Label className="text-muted-foreground text-xs mb-1 block">
              Status
            </Label>
            <Badge
              className={`capitalize text-xs cursor-pointer ${getStatusColorClass(
                cashin.status
              )}`}
            >
              {getStatusIcon(cashin.status)}
              {cashin.status}
            </Badge>
            {cashin.transactionRequestId && (
              <Badge
                className={`ml-2 capitalize text-xs cursor-pointer ${getStatusColorClass(
                  "CLAIMED"
                )}`}
              >
                {getStatusIcon("CLAIMED")}
                CLAIMED
              </Badge>
            )}
          </div>

          {/* Admin Actions */}
          <div className="flex flex-col sm:flex-row gap-2 md:col-span-2">
            {isAllowed && cashin.status !== "COMPLETED" && (
              <UpdateStatusDialog
                cashinId={id}
                currentStatus={cashin?.status}
                externalUserId={cashin.externalUserId ?? ""}
              />
            )}
            <Button
              variant="outline"
              onClick={() => setShowStatusSheet(true)}
              className="text-sm"
            >
              View Status History
            </Button>
            {/* {cashin.status !== "PENDING" && (
              <Button
                variant="outline"
                onClick={() => setShowStatusSheet(true)}
                className="text-sm"
              >
                Edit
              </Button>
            )} */}
          </div>
        </div>
      ) : (
        <div className="text-sm text-muted-foreground">No cashin found. </div>
      )}
    </>
  );

  const hasGuest = guestMembers.length > 0;
  const prevGuestCount = useRef(0);

  useEffect(() => {
    if (guestCount > prevGuestCount.current) {
      toast.info("Player joined the chat");
    }
    if (guestCount < prevGuestCount.current) {
      toast.info("Player left the chat");
    }
    prevGuestCount.current = guestCount;
  }, [guestCount]);

  return (
    <div>
      <Button
        variant="ghost"
        size="sm"
        className="flex items-center gap-2 mb-3 md:mb-4"
        onClick={() => router.back()}
      >
        <ArrowLeft size={16} className="md:h-5 md:w-5" />
        <span className="text-sm md:text-base">Back</span>
      </Button>

      {/* Mobile:  Tabs Layout */}
      <div className="block lg:hidden">
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="details" className="text-sm">
              Details
            </TabsTrigger>
            <TabsTrigger value="comments" className="text-sm">
              Comments
              {cashin && cashin.cashinThreads.length > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {cashin.cashinThreads.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="details" className="mt-0">
            <div className="px-2">
              <DetailsSection />
            </div>
          </TabsContent>
          <TabsContent value="comments" className="mt-0">
            <div className="px-2 h-[calc(100vh-280px)] flex flex-col">
              <div className="flex flex-row justify-start items-center gap-2 ">
                {/* <div>
                  <Badge>
                    <UsersRound />
                    {count}
                  </Badge>
                </div> */}

                {hasGuest ? (
                  <div className="flex items-center gap-1 h-fit px-2 py-1 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-800 shrink-0">
                    <Radio className="h-3 w-3 text-green-500 animate-pulse" />
                    <span className="block text-xs font-medium text-green-700 dark:text-green-400">
                      Player Connected
                    </span>
                    {isLoading && (
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <RefreshCcw className="text-green-600 dark:text-green-400 h-3 w-3 transition-transform duration-500 animate-spin" />
                      </div>
                    )}
                  </div>
                ) : (
                  <Badge variant="destructive">Player Disconnected</Badge>
                )}
              </div>

              <CommentsSection
                threads={cashin?.cashinThreads || []}
                isLoading={isLoading}
                sessionUserId={session?.user?.id}
                value={value}
                inputValue={inputValue}
                attachments={attachments}
                submitting={submitting}
                usersData={usersData}
                fileInputRef={fileInputRef}
                onSubmit={handleCommentSend}
                onValueChange={setValue}
                onInputValueChange={setInputValue}
                onFileChange={handleFileChange}
                onRemoveAttachment={handleRemoveAttachment}
                onPasteDrop={handlePasteDrop}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Desktop: Resizable Panels */}
      <div className="hidden lg:flex">
        <ResizablePanelGroup
          direction="horizontal"
          className="hidden lg:flex min-h-[340px] h-[calc(100vh-160px)] rounded-lg overflow-hidden border-0"
        >
          {/* Left:  Details */}
          <ResizablePanel
            defaultSize={50}
            minSize={35}
            className="flex flex-col justify-between px-4"
          >
            <DetailsSection />
          </ResizablePanel>

          <ResizableHandle />

          {/* Right: Comments / Threads */}
          <ResizablePanel
            defaultSize={50}
            minSize={35}
            className="px-6 pb-2 flex flex-col"
          >
            <div className="flex flex-row justify-start items-center gap-2 ">
              {hasGuest ? (
                <div className="flex items-center gap-1 h-fit px-2 py-1 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-800 shrink-0">
                  <Radio className="h-3 w-3 text-green-500 animate-pulse" />
                  <span className="block text-xs font-medium text-green-700 dark:text-green-400">
                    Player Connected
                  </span>
                  {isLoading && (
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <RefreshCcw className="text-green-600 dark:text-green-400 h-3 w-3 transition-transform duration-500 animate-spin" />
                    </div>
                  )}
                </div>
              ) : (
                <Badge variant="destructive">Player Disconnected</Badge>
              )}
            </div>

            <CommentsSection
              threads={cashin?.cashinThreads || []}
              isLoading={isLoading}
              sessionUserId={session?.user?.id}
              value={value}
              inputValue={inputValue}
              attachments={attachments}
              submitting={submitting}
              usersData={usersData}
              fileInputRef={fileInputRef}
              onSubmit={handleCommentSend}
              onValueChange={setValue}
              onInputValueChange={setInputValue}
              onFileChange={handleFileChange}
              onRemoveAttachment={handleRemoveAttachment}
              onPasteDrop={handlePasteDrop}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      <CashinStatusHistorySheet
        open={showStatusSheet}
        onOpenChange={setShowStatusSheet}
        data={cashin?.cashinLogs || []}
      />
      <audio
        ref={notificationAudioRef}
        src="/sounds/message.mp3"
        preload="auto"
      />
    </div>
  );
}

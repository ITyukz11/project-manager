"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Upload,
  Send,
  X,
  MessageSquare,
  UserCircle,
  Paperclip,
  Radio,
  RefreshCcw,
  MoveUpLeft,
  DoorOpen,
} from "lucide-react";

import { useEffect, useRef, useState } from "react";
import CustomFormDialog from "@/components/CustomFormDialog";
import Image from "next/image";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDate } from "date-fns";
import { useCashinById } from "@/lib/hooks/swr/cashin/useCashinById";
import { toast } from "sonner";
import { usePusher } from "@/lib/hooks/use-pusher";
import { ImagePreviewDialog } from "@/components/ImagePreviewDialog";
import Link from "next/link";
import { Spinner } from "@/components/ui/spinner";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { usePusherPresence } from "@/lib/hooks/usePusherPresence";

interface CashInContentProps {
  amount: string;
  cashinId?: string | null;
  usersData?: { id: string; username: string; role: string }[];
  playerUsername: string;
  casinoLink: string;
  setEnableChatBased: (enable: boolean) => void;
}

export function ChatBasedContent({
  cashinId,
  playerUsername,
  casinoLink,
  setEnableChatBased,
}: CashInContentProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const notificationAudioRef = useRef<HTMLAudioElement | null>(null);

  const { cashin, isLoading, error, mutate } = useCashinById(
    cashinId ?? undefined,
  );

  const [previewImg, setPreviewImg] = useState<string | null>(null);
  const [previewFilename, setPreviewFilename] = useState<string | null>(null);
  const [value, setValue] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");

  const [hasAgentEverBeenOnline, setHasAgentEverBeenOnline] = useState(false);

  const prevAgentCount = useRef(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments([...attachments, ...Array.from(e.target.files)]);
    }
  };

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

  const presenceChannel = cashinId
    ? `presence-chatbased-cashin-${cashinId}`
    : null;

  const { members, count, authenticatedCount, guestCount } = usePusherPresence(
    presenceChannel ?? "",
  );

  useEffect(() => {
    if (authenticatedCount > prevAgentCount.current) {
      toast.info("A live agent has joined the chat.");
    }

    if (authenticatedCount < prevAgentCount.current) {
      console.log("A live agent has left the chat.");
    }

    prevAgentCount.current = authenticatedCount;
  }, [authenticatedCount]);

  const agentMembers = Object.values(members).filter(
    (m) => m.info.type === "auth",
  );

  const isAgentOnline = agentMembers.length > 0;
  const hasThreadContent = (cashin?.cashinThreads?.length ?? 0) > 0;
  const shouldDisableTextarea =
    submitting || (!hasAgentEverBeenOnline && !hasThreadContent);

  useEffect(() => {
    if (isAgentOnline) {
      setHasAgentEverBeenOnline(true);
    }
  }, [isAgentOnline]);
  usePusher({
    channels: [`chatbased-cashin-${cashinId}`],
    eventName: "cashin:thread-updated",
    onEvent: () => {
      mutate(); // 🔥 refetch comments
    },
    audioRef: notificationAudioRef,
  });

  // Remove single attachment (for preview UI)
  function handleRemoveAttachment(idx: number) {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleCommentSend(e: React.FormEvent) {
    e.preventDefault();
    if (!inputValue.trim() && attachments.length === 0) return;
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("message", inputValue);
      formData.append("username", playerUsername); // only if not logged in
      attachments.forEach((file) => formData.append("attachment", file));

      const res = await fetch(`/api/cashin/${cashinId}/thread`, {
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
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  const handleCloseChat = async () => {
    try {
      setLoading(true);

      const res = await fetch(`/api/cashin/${cashinId}/close-chat`, {
        method: "PATCH",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to close chat");
      }

      // ✅ only after success
      setOpen(false);
      setEnableChatBased(false);
      toast.success("Chat closed successfully.");
    } catch (error) {
      console.error(error);
      // show toast / alert here
      // toast.error(error instanceof Error ? error.message : "Something went wrong")
    } finally {
      setLoading(false);
    }
  };

  const isWaitingForAdmin =
    !isLoading && cashin && !cashin.cashinThreads.length;

  // Comments Section Component (reusable)
  const ChatBox = () => (
    <div className="flex flex-col h-full border-t  p-2 overflow-hidden">
      <ScrollArea className="flex-1 min-h-[300px] max-h-[300px] md:max-h-[calc(100vh-300px)] pr-2 overflow-y-auto pb-2">
        {isWaitingForAdmin && (
          <div className="flex justify-center my-4">
            <div className="flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-sm text-muted-foreground">
              <MessageSquare className="h-4 w-4 animate-pulse" />
              Please wait while we connect you to a live chat…
            </div>
          </div>
        )}

        {!isLoading && cashin && cashin.cashinThreads.length === 0 && (
          <div className="flex flex-col h-full text-muted-foreground text-sm">
            <span className="italic">
              No comments yet.
              <br />
            </span>
          </div>
        )}

        {!isLoading && cashin && cashin.cashinThreads.length > 0 && (
          <ul className="flex flex-col gap-1">
            {(cashin.cashinThreads ?? []).map((thread) => {
              const isUser = playerUsername === thread.authorName;
              const date = formatDate(thread.createdAt, "MMM dd, yyyy");
              const time = formatDate(thread.createdAt, "h:mm a");

              return (
                <li key={thread.id}>
                  <div
                    className={`flex mb-1 ${
                      isUser ? "justify-end " : "justify-start"
                    }`}
                  >
                    {!isUser && (
                      <UserCircle className="mr-2 h-5 w-5 text-muted-foreground" />
                    )}

                    <div
                      className={`rounded-xl px-3 flex flex-col gap-2 py-2 text-sm max-w-[75%] ${
                        isUser
                          ? "bg-cyan-700 dark:bg-sky-800 text-white"
                          : "bg-muted dark:bg-neutral-800"
                      }`}
                    >
                      {/* NAME and ROLE */}
                      {!isUser && (
                        // authorName
                        <div className="flex flex-row gap-1">
                          <Label>
                            {thread.author?.name ? "LOADER" : thread.authorName}
                          </Label>
                        </div>
                      )}
                      <div className="flex flex-col gap-1">
                        {/* MESSAGE */}
                        <Label className="font-normal text-sm whitespace-pre-wrap wrap-break-word">
                          {thread.message}
                        </Label>
                        {/* Attachments */}
                        {(thread?.attachments ?? []).length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {(thread.attachments ?? []).map((att) =>
                              att.mimetype?.startsWith("image/") ? (
                                <button
                                  key={att.id}
                                  type="button"
                                  onClick={() => {
                                    setPreviewImg(att.url);
                                    setPreviewFilename(att.filename ?? "");
                                  }}
                                >
                                  <Image
                                    src={att.url}
                                    alt={att.filename ?? ""}
                                    width={200}
                                    height={200}
                                    className="rounded border cursor-pointer"
                                  />
                                </button>
                              ) : (
                                <a
                                  key={att.id}
                                  href={att.url}
                                  target="_blank"
                                  className="flex items-center gap-1 text-xs underline"
                                >
                                  <Paperclip size={14} />
                                  {att.filename ?? "Download"}
                                </a>
                              ),
                            )}
                          </div>
                        )}
                        <Label
                          className={cn(
                            !isUser
                              ? "text-muted-foreground "
                              : "text-white/80",
                            "font-normal text-xs flex justify-end",
                          )}
                        >
                          <span className="group relative flex items-center gap-1 cursor-default">
                            {/* Date (only on hover) */}
                            <span className="hidden group-hover:inline text-[10px] opacity-80 transition-opacity">
                              {date} -
                            </span>
                            {/* Time (always visible) */}
                            <span>{time}</span>
                          </span>
                        </Label>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </ScrollArea>

      {/* Comment form */}
      <form className="w-full" onSubmit={handleCommentSend} autoComplete="off">
        {/* Image preview/removal - top row */}
        {attachments.length > 0 && (
          <div className="flex flex-row flex-wrap gap-2 items-center mb-2">
            {attachments.map((att, idx) => (
              <div
                key={idx}
                className="relative w-12 h-12 md:w-14 md:h-14 border rounded overflow-hidden"
              >
                <Image
                  src={URL.createObjectURL(att)}
                  alt={att.name}
                  width={100}
                  height={100}
                  objectFit="cover"
                />
                <button
                  type="button"
                  className="cursor-pointer absolute top-0 right-0 bg-white bg-opacity-75 text-red-600 rounded p-0.5"
                  style={{ lineHeight: 0 }}
                  onClick={() => handleRemoveAttachment(idx)}
                  tabIndex={-1}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Chatbox Interface (plain textarea, no mentions) */}
        <div className="flex gap-2 w-full">
          <Textarea
            placeholder={
              !hasAgentEverBeenOnline && !hasThreadContent
                ? "Waiting for a live agent to join…"
                : "Type your message..."
            }
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={shouldDisableTextarea}
            className="resize-none min-h-12 ..."
            onPaste={handlePasteDrop}
            onDrop={handlePasteDrop}
          />

          <div className="flex flex-col gap-1.5 md:gap-2 shrink-0">
            <input
              type="file"
              accept="image/*"
              multiple
              hidden
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            <Button
              type="button"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={shouldDisableTextarea}
              className="h-8 w-8 p-0 md:h-10 md:w-10"
            >
              <Upload className="h-4 w-4" />
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={
                shouldDisableTextarea ||
                (inputValue.trim() === "" && attachments.length === 0)
              }
              className="h-8 w-8 p-0 md:h-10 md:w-10 mt-auto"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </form>
    </div>
  );

  return (
    <div>
      <div className="flex flex-row justify-between">
        <div className="flex flex-row flex-start sm:gap-2 flex-wrap">
          <Button
            variant={"destructive"}
            className="mb-4"
            onClick={() => setOpen(true)}
            size={"sm"}
          >
            <DoorOpen /> Leave
          </Button>
          <Link href={`https://www.${casinoLink}`}>
            <Button variant={"outline"} size={"sm"}>
              <MoveUpLeft className="h-4 w-4" />
              Go back to qbet88.vip
            </Button>
          </Link>
        </div>
        <div className="flex flex-row justify-center items-center gap-2 ">
          {/* <div>
            <Badge>
              <UsersRound />
              {count}
            </Badge>
          </div> */}
          {isAgentOnline ? (
            <div className="flex items-center gap-1 h-fit px-2 py-1 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-800 shrink-0">
              <Radio className="h-3 w-3 text-green-500 animate-pulse" />
              <span className="block  text-xs font-medium text-green-700 dark:text-green-400">
                Connected to Live Agent
              </span>
              {isLoading && (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <RefreshCcw className="text-green-600 dark:text-green-400 h-3 w-3 transition-transform duration-500 animate-spin" />
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1 h-fit px-2 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800 shrink-0">
              <Spinner className="h-3 w-3 text-blue-500" />
              <span className="sm:block hidden text-xs font-medium text-blue-700 dark:text-blue-400">
                Waiting for a live agent to join...
              </span>
              {isLoading && (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <RefreshCcw
                    className={`text-blue-600 dark:text-blue-400 h-3 w-3 transition-transform duration-500 animate-spin`}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {ChatBox()}

      {/* Dialog */}
      <CustomFormDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={handleCloseChat}
        title="Leave chat?"
        description="If you leave this the chat it will be gone and considered done."
        confirmLabel="Leave"
        loading={loading}
        className="sm:max-w-md"
        content={
          <Image
            src="/logo/chat-based-logo.png"
            alt="Close Chat"
            width={200}
            height={100}
            className="rounded-xl mx-auto"
          />
        }
      />
      {/* Image Preview Dialog */}
      <ImagePreviewDialog
        open={!!previewImg}
        imageUrl={previewImg}
        filename={previewFilename}
        onClose={() => setPreviewImg(null)}
      />
      <audio
        ref={notificationAudioRef}
        src="/sounds/message.mp3"
        preload="auto"
      />
    </div>
  );
}

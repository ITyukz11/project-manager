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
  MessageCircle,
  Radio,
  RefreshCcw,
  MoveUpLeft,
} from "lucide-react";

import { useRef, useState } from "react";
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

interface CashInContentProps {
  amount: string;
  cashinId?: string | null;
  usersData?: { id: string; username: string; role: string }[];
  playerUsername: string;
  casinoLink: string;
  setEnableChatBased: (enable: boolean) => void;
}

export function ChatBasedContent({
  amount,
  cashinId,
  usersData,
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
    cashinId ?? undefined
  );

  const [previewImg, setPreviewImg] = useState<string | null>(null);
  const [previewFilename, setPreviewFilename] = useState<string | null>(null);
  const [value, setValue] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");

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
  console.log("cashinId:", cashinId);
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

      // 🔥 your cleanup logic here
      // e.g. clear chat state, reset messages, navigate away
      // await clearChat();

      setOpen(false);
      setEnableChatBased(false);
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
          <ul className="flex flex-col gap-3">
            {cashin.cashinThreads.map((thread) => {
              const author = thread.authorName || "Loader";
              const isUser =
                (thread.authorId &&
                  usersData?.some((user) => user.id === thread.authorId)) ||
                (thread.authorName && thread.authorName === playerUsername);
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
                      className={`rounded-xl px-3 md:px-4 py-2 text-sm md:text-base max-w-[85%] md:max-w-[75%] ${
                        isUser
                          ? "bg-black text-white"
                          : "bg-gray-100 text-gray-900 dark:bg-neutral-800 dark:text-white"
                      }`}
                    >
                      {thread.message}
                      {Array.isArray(thread.attachments) &&
                        thread.attachments.length > 0 && (
                          <div className="mt-2 flex flex-row flex-wrap gap-2">
                            {thread.attachments.map((att) =>
                              att.mimetype?.startsWith("image/") ? (
                                <button
                                  type="button"
                                  key={att.id}
                                  className="cursor-pointer block border rounded max-w-20 max-h-20 md:max-w-24 md:max-h-24 overflow-hidden focus:ring"
                                  onClick={() => {
                                    setPreviewImg(att.url);
                                    setPreviewFilename(att.filename);
                                  }}
                                  style={{
                                    padding: 0,
                                    background: "none",
                                    border: "none",
                                  }}
                                >
                                  <Image
                                    src={att.url}
                                    alt={att.filename}
                                    width={100}
                                    height={200}
                                    objectFit="cover"
                                  />
                                </button>
                              ) : (
                                <a
                                  href={att.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  key={att.id}
                                  className="flex items-center gap-1 text-xs underline text-blue-500 dark:text-blue-400"
                                >
                                  <Paperclip size={16} />{" "}
                                  {att.filename ?? att.url}
                                </a>
                              )
                            )}
                          </div>
                        )}
                    </div>
                  </div>
                  <div
                    className={`w-full flex items-center ${
                      isUser ? "justify-end pr-2" : "justify-start pl-7"
                    }`}
                  >
                    <span className="text-xs text-muted-foreground dark:text-gray-400">
                      {author} &middot; {dateTime}
                    </span>
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
              isWaitingForAdmin
                ? "Waiting for a live agent to join…"
                : "Type your message..."
            }
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={submitting || isWaitingForAdmin}
            className="resize-none min-h-12 ..."
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
              disabled={submitting}
              className="h-8 w-8 p-0 md:h-10 md:w-10"
            >
              <Upload className="h-4 w-4" />
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={
                submitting ||
                isWaitingForAdmin ||
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
          >
            <X /> Close Chat-Based Payment
          </Button>
          <Link href={`https://www.${casinoLink}`}>
            <Button variant={"outline"}>
              <MoveUpLeft className="h-4 w-4" />
              Go back to qbet88.vip
            </Button>
          </Link>
        </div>
        {!isWaitingForAdmin ? (
          <div className="flex items-center gap-1 h-fit px-2 py-1 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-800 shrink-0">
            <Radio className="h-3 w-3 text-green-500 animate-pulse" />
            <span className="sm:block hidden text-xs font-medium text-green-700 dark:text-green-400">
              Connected to Live Agent
            </span>
            {isLoading && (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <RefreshCcw
                  className={`text-green-600 dark:text-green-400 h-3 w-3 transition-transform duration-500 animate-spin`}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1 h-fit px-2 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800 shrink-0">
            <Spinner className="h-3 w-3 text-blue-500" />
            <span className="sm:block hidden text-xs font-medium text-blue-700 dark:text-blue-400">
              Connecting...
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

      {ChatBox()}

      {/* Dialog */}
      <CustomFormDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={handleCloseChat}
        title="Close chat?"
        description="If you close this the chat will be gone."
        confirmLabel="Close chat"
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

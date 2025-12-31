"use client";

import Image from "next/image";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  MessageSquare,
  UserCircle,
  Upload,
  Send,
  X,
  Paperclip,
} from "lucide-react";
import {
  Mention,
  MentionContent,
  MentionInput,
  MentionItem,
} from "./ui/mention";
import { formatDate } from "date-fns";
import { RefObject, useState } from "react";
import { cn } from "@/lib/utils";
import { ImagePreviewDialog } from "./ImagePreviewDialog";

type CommentAuthor = {
  id: string;
  name?: string;
  role?: string;
};

type CommentAttachment = {
  id: string;
  url: string;
  filename?: string;
  mimetype?: string;
};

type CommentThread = {
  id: string;
  message: string;
  createdAt: Date | string;
  author?: CommentAuthor;
  authorName?: string | null;
  attachments?: CommentAttachment[];
};

interface CommentsSectionProps {
  title?: string;
  threads: CommentThread[] | undefined;
  isLoading?: boolean;

  sessionUserId?: string;

  // form state
  value: string[];
  inputValue: string;
  attachments: File[];
  submitting?: boolean;

  usersData?: { id: string; username: string; name: string; role?: string }[];

  // handlers
  onValueChange: (v: string[]) => void;
  onInputValueChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveAttachment: (index: number) => void;
  onPasteDrop: (e: React.ClipboardEvent | React.DragEvent) => void;

  fileInputRef: RefObject<HTMLInputElement | null>;
}

export function CommentsSection({
  title = "Comments",
  threads,
  isLoading,
  sessionUserId,

  value,
  inputValue,
  attachments,
  submitting,

  usersData,

  onValueChange,
  onInputValueChange,
  onSubmit,
  onFileChange,
  onRemoveAttachment,
  onPasteDrop,

  fileInputRef,
}: CommentsSectionProps) {
  const [previewImg, setPreviewImg] = useState<string | null>(null);
  const [previewFilename, setPreviewFilename] = useState<string | null>(null);
  // Custom filter that matches commands starting with the search term
  function onFilter(options: string[], term: string) {
    return options.filter((option) =>
      option.toLowerCase().startsWith(term.toLowerCase())
    );
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== "Enter") return;

    // Alt + Enter → force newline
    if (e.altKey) {
      e.preventDefault();

      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      const newValue =
        inputValue.slice(0, start) + "\n" + inputValue.slice(end);

      onInputValueChange(newValue);

      // Restore cursor position
      requestAnimationFrame(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 1;
      });

      return;
    }

    // Enter → submit
    e.preventDefault();

    if (inputValue.trim() === "" && attachments.length === 0) return;

    onSubmit(e as unknown as React.FormEvent);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="mb-3 md:mb-4 text-lg md:text-xl font-semibold flex items-center gap-2">
        <MessageSquare className="h-5 w-5 md:hidden" />
        {title} {threads && `(${threads.length})`}
      </div>

      {/* Threads */}
      <ScrollArea className="flex-1 min-h-[200px] max-h-[400px] md:max-h-[calc(100vh-300px)] pr-2">
        {!isLoading && (threads ?? []).length === 0 && (
          <div className="italic text-sm text-muted-foreground">
            No comments yet.
          </div>
        )}

        {!isLoading && (threads ?? []).length > 0 && (
          <ul className="flex flex-col gap-1">
            {(threads ?? []).map((thread) => {
              const isUser = sessionUserId === thread.author?.id;
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
                            {thread.author?.name ?? thread.authorName}
                          </Label>
                          <Label className="font-light text-muted-foreground">
                            {thread.author?.role
                              ? `(${thread.author.role})`
                              : ""}
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
                                    width={100}
                                    height={100}
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
                              )
                            )}
                          </div>
                        )}
                        <Label
                          className={cn(
                            !isUser
                              ? "text-muted-foreground "
                              : "text-white/80",
                            "font-normal text-xs flex justify-end"
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

      {/* Form */}
      <form onSubmit={onSubmit} className="mt-2">
        {attachments.length > 0 && (
          <div className="flex gap-2 mb-2">
            {attachments.map((file, i) => (
              <div key={i} className="relative w-12 h-12 border rounded">
                <Image
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  fill
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={() => onRemoveAttachment(i)}
                  className="absolute top-0 right-0 bg-white rounded"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <Mention
            trigger="@"
            value={value}
            onValueChange={onValueChange}
            inputValue={inputValue}
            onInputValueChange={onInputValueChange}
            onFilter={onFilter}
            className="flex-1"
          >
            <MentionInput
              asChild
              onPaste={onPasteDrop}
              onDrop={onPasteDrop}
              value={inputValue}
              onChange={(e) => onInputValueChange(e.target.value)}
            >
              <Textarea
                rows={4}
                placeholder="Type @ to mention a user…"
                disabled={submitting}
                onKeyDown={handleKeyDown}
              />
            </MentionInput>

            <MentionContent className="max-h-[500px] overflow-y-auto">
              {usersData?.map((u) => (
                <MentionItem
                  key={u.id}
                  value={u.username}
                  className="*:cursor-pointer "
                >
                  <Label className="font-medium">{u.username}</Label>
                  <Label className="text-xs italic  text-amber-600 dark:text-amber-300">
                    ({u.role})
                  </Label>
                  <Label className="text-xs text-muted-foreground">
                    {u.name}
                  </Label>
                </MentionItem>
              ))}
            </MentionContent>
          </Mention>

          <div className="flex flex-col gap-2">
            <input
              ref={fileInputRef}
              type="file"
              hidden
              multiple
              accept="image/*"
              onChange={onFileChange}
            />
            <Button
              type="button"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={16} />
            </Button>
            <Button
              type="submit"
              size="icon"
              disabled={
                submitting &&
                inputValue.trim() === "" &&
                attachments.length === 0
              }
            >
              <Send size={16} />
            </Button>
          </div>
        </div>
      </form>

      {/* Image Preview Dialog */}
      <ImagePreviewDialog
        open={!!previewImg}
        imageUrl={previewImg}
        filename={previewFilename}
        onClose={() => setPreviewImg(null)}
      />
    </div>
  );
}

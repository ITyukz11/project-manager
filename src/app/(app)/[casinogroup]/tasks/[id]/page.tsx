"use client";
import {
  ArrowLeft,
  Paperclip,
  Send,
  Upload,
  UserCircle,
  X,
  MessageSquare,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useRef, useState } from "react";
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
import { toast } from "sonner";
import {
  Mention,
  MentionContent,
  MentionInput,
  MentionItem,
} from "@/components/ui/mention";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "next-auth/react";
import { UpdateStatusDialog } from "../(components)/UpdateStatusDialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { StatusHistorySheet } from "@/components/StatusHistorySheet";
import { useTaskById } from "@/lib/hooks/swr/task/useTaskById";
import { useUsers } from "@/lib/hooks/swr/user/useUsersData";
import {
  avoidDefaultDomBehavior,
  handleKeyDown,
} from "@/lib/utils/dialogcontent.utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Page() {
  const { id, casinogroup } = useParams();
  const router = useRouter();
  const { task, isLoading, error, mutate } = useTaskById(id as string);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { usersData } = useUsers(casinogroup?.toLocaleString());
  const { data: session } = useSession();
  const [previewImg, setPreviewImg] = useState<string | null>(null);
  const [previewFilename, setPreviewFilename] = useState<string | null>(null);
  const [showStatusSheet, setShowStatusSheet] = useState(false);

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

  async function handleCommentSend(e: React.FormEvent) {
    e.preventDefault();
    if (!comment.trim() && attachments.length === 0) return;
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("message", comment);
      attachments.forEach((file) => formData.append("attachment", file));

      const res = await fetch(`/api/task/${id}/thread`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to post comment");
      }

      setComment("");
      setAttachments([]);
      mutate();
      toast.success("Comment posted!");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  const canUpdateStatus =
    session?.user.id === task?.userId ||
    (session?.user?.id &&
      task?.tagUsers.some((user) => user.id === session.user.id));

  // Comments Section Component (reusable)
  const CommentsSection = () => (
    <div className="flex flex-col h-full">
      <div className="mb-3 md:mb-4 text-lg md:text-xl font-semibold text-foreground flex items-center gap-2">
        <MessageSquare className="h-5 w-5 md:hidden" />
        Comments
      </div>
      <ScrollArea className="flex-1 min-h-[200px] max-h-[400px] md:max-h-[calc(100vh-300px)] pr-2">
        {!isLoading && task && task.taskThreads.length === 0 && (
          <div className="flex flex-col h-full text-muted-foreground text-sm">
            <span className="italic">
              No comments yet.
              <br />
            </span>
          </div>
        )}

        {!isLoading && task && task.taskThreads.length > 0 && (
          <ul className="flex flex-col gap-3">
            {task.taskThreads.map((thread) => {
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
                      className={`rounded-xl px-3 md:px-4 py-2 text-sm md:text-base max-w-[85%] md:max-w-[75%] ${
                        isUser
                          ? "bg-black text-white"
                          : "bg-gray-100 text-gray-900 dark:bg-neutral-900 dark:text-white"
                      }`}
                    >
                      {thread.message}
                      {/* Attachments:  display image previews, other files as download links */}
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
                                  <img
                                    src={att.url}
                                    alt={att.filename}
                                    className="object-cover w-full h-full"
                                    style={{
                                      maxWidth: "5rem",
                                      maxHeight: "5rem",
                                    }}
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
        className="w-full mt-2"
        onSubmit={handleCommentSend}
        autoComplete="off"
      >
        {/* Image preview/removal - top row */}
        {attachments.length > 0 && (
          <div className="flex flex-row flex-wrap gap-2 items-center mb-2">
            {attachments.map((att, idx) => (
              <div
                key={idx}
                className="relative w-12 h-12 md:w-14 md:h-14 border rounded overflow-hidden"
              >
                <img
                  src={URL.createObjectURL(att)}
                  alt={att.name}
                  className="object-cover w-full h-full"
                />
                <button
                  type="button"
                  className="absolute top-0 right-0 bg-white bg-opacity-75 text-red-600 rounded p-0. 5"
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

        {/* Mention + textarea, with paste & drop support */}
        <div className="flex gap-2 w-full">
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
              className="h-16 md:h-20 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              onPaste={handlePasteDrop}
              onDrop={handlePasteDrop}
            >
              <Textarea
                className="resize-none min-h-12 text-sm md:text-base font-sans bg-card text-foreground dark:bg-neutral-900 dark:text-white border border-muted focus:border-blue-500 dark:focus:border-blue-400"
                rows={3}
              />
            </MentionInput>
            <MentionContent>
              {usersData?.map((user) => (
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
                submitting || (!comment.trim() && attachments.length === 0)
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
      ) : task ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-y-4 md:gap-x-8">
          {/* Subject */}
          <div>
            <Label className="text-muted-foreground text-xs mb-1 block">
              Subject
            </Label>
            <Input readOnly value={task.subject} className="text-sm" />
          </div>

          {/* Entry By */}
          <div>
            <Label className="text-muted-foreground text-xs mb-1 block">
              Entry By
            </Label>
            <Input readOnly value={task.user?.name} className="text-sm" />
          </div>

          {/* Details */}
          <div className="md:col-span-1">
            <Label className="text-muted-foreground text-xs mb-1 block">
              Details
            </Label>
            <Textarea
              readOnly
              value={task.details}
              className="text-sm min-h-20"
            />
          </div>

          {/* Date of Request */}
          <div>
            <Label className="text-muted-foreground text-xs mb-1 block">
              Date of Request
            </Label>
            <Input
              readOnly
              value={
                task.createdAt
                  ? formatDate(task.createdAt, "M/dd/yyyy 'at' hh:mm a")
                  : "—"
              }
              className="text-sm"
            />
          </div>

          {/* Attachments */}
          <div className="md:col-span-1">
            <Label className="text-muted-foreground text-xs mb-1 block">
              Attachments
            </Label>
            <div className="border rounded-md p-2 min-h-20 bg-muted/20">
              <ul className="space-y-1">
                {Array.isArray(task.attachments) &&
                  task.attachments.length === 0 && (
                    <li className="text-xs text-muted-foreground italic">
                      No attachments
                    </li>
                  )}
                {Array.isArray(task.attachments) &&
                  task.attachments.map((att) => (
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

          {/* Tagged Users */}
          <div className="md:col-span-1">
            {task.tagUsers.length > 0 && (
              <>
                <Label className="text-muted-foreground text-xs mb-1 block">
                  Tagged Users
                </Label>
                <div className="border rounded-md p-2 bg-muted/20">
                  <ul className="space-y-1">
                    {task.tagUsers.map((user) => (
                      <li key={user.id} className="text-xs text-foreground">
                        <span className="font-medium">{user.username}</span>
                        <span className="text-muted-foreground ml-1">
                          ({user.role})
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </div>

          {/* Status */}
          <div className="md:col-span-2">
            <Label className="text-muted-foreground text-xs mb-1 block">
              Status
            </Label>
            <Badge
              className={`capitalize text-xs cursor-pointer ${
                task.status === "PENDING"
                  ? "bg-yellow-400 text-black"
                  : task.status === "COMPLETED"
                  ? "bg-green-600 text-white"
                  : "bg-red-600 text-white"
              }`}
            >
              {task.status}
            </Badge>
          </div>

          {/* Admin Actions */}
          <div className="flex flex-col sm:flex-row gap-2 md:col-span-2">
            {canUpdateStatus && (
              <UpdateStatusDialog taskId={id} currentStatus={task?.status} />
            )}
            <Button
              variant="outline"
              onClick={() => setShowStatusSheet(true)}
              className="text-sm"
            >
              View Status History
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-sm text-muted-foreground">No task found. </div>
      )}
    </>
  );

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
              {task && task.taskThreads.length > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {task.taskThreads.length}
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
              <CommentsSection />
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
            <CommentsSection />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Image Preview Dialog */}
      <Dialog open={!!previewImg} onOpenChange={() => setPreviewImg(null)}>
        <DialogContent
          className="max-w-[90vw] sm:max-w-lg md:max-w-xl"
          onPointerDownOutside={avoidDefaultDomBehavior}
          onInteractOutside={avoidDefaultDomBehavior}
          onKeyDown={handleKeyDown}
        >
          <DialogHeader>
            <DialogTitle className="text-sm md:text-base truncate">
              {previewFilename}
            </DialogTitle>
          </DialogHeader>
          {previewImg && (
            <img
              src={previewImg}
              alt={previewFilename || "preview"}
              className="mx-auto block max-h-[60vh] md:max-h-[75vh] w-auto object-contain rounded shadow"
            />
          )}
        </DialogContent>
      </Dialog>

      <StatusHistorySheet
        open={showStatusSheet}
        onOpenChange={setShowStatusSheet}
        data={task?.taskLogs || []}
      />
    </div>
  );
}

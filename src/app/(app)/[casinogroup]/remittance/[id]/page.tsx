"use client";
import {
  ArrowLeft,
  Paperclip,
  Send,
  Upload,
  UserCircle,
  X,
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
import { useUsersNetwork } from "@/lib/hooks/swr/network/useUserNetwork";
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
import { ADMINROLES } from "@/lib/types/role";
import { StatusHistorySheet } from "@/components/StatusHistorySheet";
import { useRemittanceById } from "@/lib/hooks/swr/remittance/useRemittanceById";

export default function Page() {
  const { id } = useParams();
  const router = useRouter();
  const { remittance, isLoading, error, mutate } = useRemittanceById(
    id as string
  );
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { usersDataNetwork } = useUsersNetwork();
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

      const res = await fetch(`/api/remittance/${id}/thread`, {
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

  return (
    <div>
      <Button
        variant="ghost"
        className="flex items-center gap-2"
        onClick={() => router.back()}
      >
        <ArrowLeft size={18} /> Back
      </Button>

      <ResizablePanelGroup
        direction="horizontal"
        className="min-h-[340px] h-[calc(100vh-160px)] rounded-lg overflow-hidden border-0"
      >
        {/* Left: Details */}
        <ResizablePanel
          defaultSize={50}
          minSize={35}
          className="flex flex-col justify-between px-2"
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
          ) : remittance ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
              {/* Username and Bank/E-wallet */}
              <div>
                <Label className="text-muted-foreground text-xs mb-1 block">
                  Subject
                </Label>
                <Input readOnly value={remittance.subject} />
              </div>

              {/* Entry By and Agent Tip */}
              <div>
                <Label className="text-muted-foreground text-xs mb-1 block">
                  Entry By
                </Label>
                <Input readOnly value={remittance.user?.name} />
              </div>
              {/* Details */}
              <div>
                <Label className="text-muted-foreground text-xs mb-1 block">
                  Details
                </Label>
                <Textarea readOnly value={remittance.details} />
              </div>
              {/* Date Requested At */}
              <div>
                <Label className="text-muted-foreground text-xs mb-1 block">
                  Date of Request
                </Label>
                <Input
                  readOnly
                  value={
                    remittance.createdAt
                      ? formatDate(
                          remittance.createdAt,
                          "M/dd/yyyy 'at' hh:mm a"
                        )
                      : "—"
                  }
                />
              </div>

              {/* Attachments */}
              <div>
                <Label className="text-muted-foreground text-xs mb-1 block">
                  Attachments
                </Label>
                <ul className="mt-1 space-y-1">
                  {Array.isArray(remittance.attachments) &&
                    remittance.attachments.length === 0 && (
                      <li className="text-xs text-muted-foreground">
                        No attachments
                      </li>
                    )}
                  {Array.isArray(remittance.attachments) &&
                    remittance.attachments.map((att) => (
                      <li key={att.id} className="flex items-center gap-1">
                        <Paperclip
                          size={16}
                          className="text-muted-foreground"
                        />
                        <a
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 dark:text-blue-400 hover:underline text-xs"
                        >
                          {att.filename ?? att.url}
                        </a>
                      </li>
                    ))}
                </ul>
              </div>

              {/* Status and Amount */}
              <div>
                <Label className="text-muted-foreground text-xs mb-1 block">
                  Status
                </Label>
                <Badge
                  className={`capitalize text-xs cursor-pointer ${
                    remittance.status === "PENDING"
                      ? "bg-yellow-400 text-black"
                      : remittance.status === "COMPLETED"
                      ? "bg-green-600 text-white"
                      : "bg-red-600 text-white"
                  }`}
                >
                  {remittance.status}
                </Badge>
              </div>
              <div className="flex flex-row gap-2 col-span-2">
                {/* Admin actions */}
                {(session?.user?.role === ADMINROLES.ADMIN ||
                  session?.user?.role === ADMINROLES.SUPERADMIN ||
                  session?.user?.role === ADMINROLES.ACCOUNTING) && (
                  <UpdateStatusDialog
                    remittanceId={id}
                    currentStatus={remittance?.status}
                  />
                )}
                <Button
                  variant="outline"
                  onClick={() => setShowStatusSheet(true)}
                >
                  View Status History
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              No remittance found.
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
              {!isLoading &&
                remittance &&
                remittance.remittanceThreads.length === 0 && (
                  <div className="flex flex-col h-full text-muted-foreground text-sm">
                    <span className="italic">
                      No comments yet.
                      <br />
                    </span>
                  </div>
                )}

              {!isLoading &&
                remittance &&
                remittance.remittanceThreads.length > 0 && (
                  <ul className="flex flex-col gap-3">
                    {remittance.remittanceThreads.map((thread) => {
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
                              {/* Attachments: display image previews, other files as download links */}
                              {Array.isArray(thread.attachments) &&
                                thread.attachments.length > 0 && (
                                  <div className="mt-2 flex flex-row flex-wrap gap-2">
                                    {thread.attachments.map((att) =>
                                      att.mimetype?.startsWith("image/") ? (
                                        <button
                                          type="button"
                                          key={att.id}
                                          className="cursor-pointer block border rounded max-w-24 max-h-24 overflow-hidden focus:ring"
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
                                              maxWidth: "6rem",
                                              maxHeight: "6rem",
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
                      className="relative w-14 h-14 border rounded overflow-hidden"
                    >
                      <img
                        src={URL.createObjectURL(att)}
                        alt={att.name}
                        className="object-cover w-full h-full"
                      />
                      <button
                        type="button"
                        className="absolute top-0 right-0 bg-white bg-opacity-75 text-red-600 rounded"
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
                    className="h-20 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                    onPaste={handlePasteDrop}
                    onDrop={handlePasteDrop}
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
                    onClick={() => fileInputRef.current?.click()}
                    disabled={submitting}
                  >
                    <Upload />
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      submitting ||
                      (!comment.trim() && attachments.length === 0)
                    }
                    className="mt-auto"
                  >
                    <Send />
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
      <Dialog open={!!previewImg} onOpenChange={() => setPreviewImg(null)}>
        <DialogContent className="max-w-lg md:max-w-xl">
          <DialogHeader>
            <DialogTitle>{previewFilename}</DialogTitle>
          </DialogHeader>
          {previewImg && (
            <img
              src={previewImg}
              alt={previewFilename || "preview"}
              className="mx-auto block max-h-[75vh] w-auto object-contain rounded shadow"
            />
          )}
        </DialogContent>
      </Dialog>
      <StatusHistorySheet
        open={showStatusSheet}
        onOpenChange={setShowStatusSheet}
        data={remittance?.remittanceLogs || []}
      />
    </div>
  );
}

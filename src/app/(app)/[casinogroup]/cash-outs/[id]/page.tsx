"use client";
import { useCashoutById } from "@/lib/hooks/swr/cashout/useCashoutById";
import { ArrowLeft, Paperclip } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useRef, useState } from "react";
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
import { CashoutStatusHistorySheet } from "../(components)/CashoutStatusHistorySheet";
import { Input } from "@/components/ui/input";
import { ADMINROLES } from "@/lib/types/role";
import {
  getStatusColorClass,
  getStatusIcon,
} from "@/components/getStatusColorClass";
import { useUsers } from "@/lib/hooks/swr/user/useUsersData";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImagePreviewDialog } from "@/components/ImagePreviewDialog";
import { cn } from "@/lib/utils";
import { CommentsSection } from "@/components/CommentSection";

export default function Page() {
  const { id, casinogroup } = useParams();

  const router = useRouter();
  const { cashout, isLoading, error, mutate } = useCashoutById(id as string);
  const [value, setValue] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { usersData } = useUsers(casinogroup?.toLocaleString());
  const { data: session } = useSession();
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
    if (!inputValue.trim() && attachments.length === 0) return;
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("message", inputValue);
      attachments.forEach((file) => formData.append("attachment", file));

      const res = await fetch(`/api/cashout/${id}/thread`, {
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
      // toast.success("Comment posted!");
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

  // Comments Section Component (reusable)
  // const CommentsSection = () => (
  //   <div className="flex flex-col h-full">
  //     <div className="mb-3 md:mb-4 text-lg md:text-xl font-semibold text-foreground flex items-center gap-2">
  //       <MessageSquare className="h-5 w-5 md:hidden" />
  //       Comments
  //     </div>
  //     <ScrollArea className="flex-1 min-h-[200px] max-h-[400px] md:max-h-[calc(100vh-300px)] pr-2">
  //       {!isLoading && cashout && cashout.cashoutThreads.length === 0 && (
  //         <div className="flex flex-col h-full text-muted-foreground text-sm">
  //           <span className="italic">
  //             No comments yet.
  //             <br />
  //           </span>
  //         </div>
  //       )}

  //       {!isLoading && cashout && cashout.cashoutThreads.length > 0 && (
  //         <ul className="flex flex-col gap-3">
  //           {cashout.cashoutThreads.map((thread) => {
  //             const author = thread.author?.name || "—";
  //             const role = thread.author?.role;
  //             const isUser = session?.user?.id === thread.author?.id;
  //             const dateTime = formatDate(
  //               thread.createdAt,
  //               "MM/dd/yy 'at' hh:mm a"
  //             );

  //             return (
  //               <li
  //                 key={thread.id}
  //                 className="flex flex-col items-start overflow-visible px-1 w-full"
  //               >
  //                 <div
  //                   className={`flex items-end mb-1 w-full ${
  //                     isUser ? "justify-end" : "justify-start"
  //                   }`}
  //                 >
  //                   {!isUser && (
  //                     <UserCircle className="text-gray-400 mr-2 w-5 h-5 shrink-0" />
  //                   )}
  //                   <div
  //                     className={`rounded-xl px-3 md:px-4 py-2 text-sm md:text-base max-w-[85%] md:max-w-[75%] ${
  //                       isUser
  //                         ? "bg-black text-white"
  //                         : "bg-gray-100 text-gray-900 dark:bg-neutral-800 dark:text-white"
  //                     }`}
  //                   >
  //                     {thread.message}
  //                     {/* Attachments:  display image previews, other files as download links */}
  //                     {Array.isArray(thread.attachments) &&
  //                       thread.attachments.length > 0 && (
  //                         <div className="mt-2 flex flex-row flex-wrap gap-2">
  //                           {thread.attachments.map((att) =>
  //                             att.mimetype?.startsWith("image/") ? (
  //                               <button
  //                                 type="button"
  //                                 key={att.id}
  //                                 className="cursor-pointer block border rounded max-w-20 max-h-20 md:max-w-24 md:max-h-24 overflow-hidden focus:ring"
  //                                 onClick={() => {
  //                                   setPreviewImg(att.url);
  //                                   setPreviewFilename(att.filename);
  //                                 }}
  //                                 style={{
  //                                   padding: 0,
  //                                   background: "none",
  //                                   border: "none",
  //                                 }}
  //                               >
  //                                 <Image
  //                                   src={att.url}
  //                                   alt={att.filename}
  //                                   width={100}
  //                                   height={200}
  //                                   objectFit="cover"
  //                                 />
  //                               </button>
  //                             ) : (
  //                               <a
  //                                 href={att.url}
  //                                 target="_blank"
  //                                 rel="noopener noreferrer"
  //                                 key={att.id}
  //                                 className="flex items-center gap-1 text-xs underline text-blue-500 dark:text-blue-400"
  //                               >
  //                                 <Paperclip size={16} />{" "}
  //                                 {att.filename ?? att.url}
  //                               </a>
  //                             )
  //                           )}
  //                         </div>
  //                       )}
  //                   </div>
  //                 </div>
  //                 <div
  //                   className={`w-full flex items-center ${
  //                     isUser ? "justify-end pr-2" : "justify-start pl-7"
  //                   }`}
  //                 >
  //                   <span className="text-xs text-muted-foreground dark:text-gray-400">
  //                     {role} &middot; {author} &middot; {dateTime}
  //                   </span>
  //                 </div>
  //               </li>
  //             );
  //           })}
  //         </ul>
  //       )}
  //     </ScrollArea>

  //     {/* Comment form */}
  //     <form className="w-full" onSubmit={handleCommentSend} autoComplete="off">
  //       {/* Image preview/removal - top row */}
  //       {attachments.length > 0 && (
  //         <div className="flex flex-row flex-wrap gap-2 items-center mb-2">
  //           {attachments.map((att, idx) => (
  //             <div
  //               key={idx}
  //               className="relative w-12 h-12 md:w-14 md:h-14 border rounded overflow-hidden"
  //             >
  //               <Image
  //                 src={URL.createObjectURL(att)}
  //                 alt={att.name}
  //                 width={100}
  //                 height={100}
  //                 objectFit="cover"
  //               />
  //               <button
  //                 type="button"
  //                 className="cursor-pointer absolute top-0 right-0 bg-white bg-opacity-75 text-red-600 rounded p-0.5"
  //                 style={{ lineHeight: 0 }}
  //                 onClick={() => handleRemoveAttachment(idx)}
  //                 tabIndex={-1}
  //               >
  //                 <X size={12} />
  //               </button>
  //             </div>
  //           ))}
  //         </div>
  //       )}

  //       {/* Mention + textarea, with paste & drop support */}
  //       <div className="flex gap-2 w-full">
  //         <Mention
  //           trigger="@"
  //           className="w-full"
  //           value={value}
  //           onValueChange={setValue}
  //           inputValue={inputValue}
  //           onInputValueChange={setInputValue}
  //           onFilter={onFilter}
  //         >
  //           <MentionInput
  //             asChild
  //             placeholder="Type @ to mention a user…"
  //             disabled={submitting}
  //             className="h-16 md:h-20 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
  //             onPaste={handlePasteDrop}
  //             onDrop={handlePasteDrop}
  //             value={inputValue}
  //             onChange={(e) => setInputValue(e.target.value)}
  //           >
  //             <Textarea
  //               className="resize-none min-h-12 text-sm md:text-base font-sans bg-card text-foreground dark:bg-neutral-900 dark:text-white border border-muted focus:border-blue-500 dark:focus:border-blue-400"
  //               rows={3}
  //             />
  //           </MentionInput>
  //           <MentionContent>
  //             {usersData?.map((user) => (
  //               <MentionItem
  //                 key={user.id}
  //                 value={user.username}
  //                 className="flex items-center gap-2 px-2 py-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900"
  //               >
  //                 <span className="font-medium text-sm text-foreground dark:text-blue-200">
  //                   {user.username}
  //                 </span>
  //                 <Label className="text-xs italic text-muted-foreground dark:text-blue-300">
  //                   {user.role}
  //                 </Label>
  //               </MentionItem>
  //             ))}
  //           </MentionContent>
  //         </Mention>
  //         <div className="flex flex-col gap-1.5 md:gap-2 shrink-0">
  //           <input
  //             type="file"
  //             accept="image/*"
  //             multiple
  //             hidden
  //             ref={fileInputRef}
  //             onChange={handleFileChange}
  //           />
  //           <Button
  //             type="button"
  //             size="sm"
  //             onClick={() => fileInputRef.current?.click()}
  //             disabled={submitting}
  //             className="h-8 w-8 p-0 md:h-10 md:w-10"
  //           >
  //             <Upload className="h-4 w-4" />
  //           </Button>
  //           <Button
  //             type="submit"
  //             size="sm"
  //             disabled={
  //               submitting ||
  //               (inputValue.trim() === "" && attachments.length === 0)
  //             }
  //             className="h-8 w-8 p-0 md:h-10 md:w-10 mt-auto"
  //           >
  //             <Send className="h-4 w-4" />
  //           </Button>
  //         </div>
  //       </div>
  //     </form>
  //   </div>
  // );

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
      ) : cashout ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-y-4 md:gap-x-8">
          {/* Username */}
          <div>
            <Label className="text-muted-foreground text-xs mb-1 block">
              Username
            </Label>
            <Input readOnly value={cashout.userName} className="text-sm" />
          </div>

          {/* Amount */}
          <div>
            <Label className="text-muted-foreground text-xs mb-1 block">
              Amount
            </Label>
            <Input
              readOnly
              value={formatAmountWithDecimals(cashout.amount)}
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
              {cashout.transactionRequestId && (
                <span className="relative inline-flex">
                  {/* Ping layer (only when PENDING) */}
                  {cashout.status === "COMPLETED" && (
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

              <Label className="font-normal">{cashout.user?.name}</Label>
            </div>

            {/* <Input readOnly value={cashout.user?.name} className="text-sm" /> */}
          </div>

          {/* Date Requested At */}
          <div>
            <Label className="text-muted-foreground text-xs mb-1 block">
              Date of Request
            </Label>
            <Input
              readOnly
              value={
                cashout.createdAt
                  ? formatDate(cashout.createdAt, "M/dd/yyyy 'at' hh:mm a")
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
              value={cashout.details}
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
                {Array.isArray(cashout.attachments) &&
                  cashout.attachments.length === 0 && (
                    <li className="text-xs text-muted-foreground italic">
                      No attachments
                    </li>
                  )}
                {Array.isArray(cashout.attachments) &&
                  cashout.attachments.map((att) => (
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
                cashout.status
              )}`}
            >
              {getStatusIcon(cashout.status)}
              {cashout.status}
            </Badge>
            {cashout.transactionRequestId && (
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
            {isAllowed && (
              <UpdateStatusDialog
                cashoutId={id}
                currentStatus={cashout?.status}
              />
            )}
            <Button
              variant="outline"
              onClick={() => setShowStatusSheet(true)}
              className="text-sm"
            >
              View Status History
            </Button>
            {cashout.status !== "PENDING" && (
              <Button
                variant="outline"
                onClick={() => setShowStatusSheet(true)}
                className="text-sm"
              >
                Edit
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="text-sm text-muted-foreground">No cashout found. </div>
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
              {cashout && cashout.cashoutThreads.length > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {cashout.cashoutThreads.length}
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
              <CommentsSection
                threads={cashout?.cashoutThreads || []}
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
            <CommentsSection
              threads={cashout?.cashoutThreads || []}
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

      <CashoutStatusHistorySheet
        open={showStatusSheet}
        onOpenChange={setShowStatusSheet}
        data={cashout?.cashoutLogs || []}
      />
    </div>
  );
}

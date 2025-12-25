"use client";
import { ArrowLeft, Paperclip } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
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
import { useSession } from "next-auth/react";
import { UpdateStatusDialog } from "../(components)/UpdateStatusDialog";
import { Skeleton } from "@/components/ui/skeleton";

import { Input } from "@/components/ui/input";
import { StatusHistorySheet } from "@/components/StatusHistorySheet";
import { useRemittanceById } from "@/lib/hooks/swr/remittance/useRemittanceById";
import { useUsers } from "@/lib/hooks/swr/user/useUsersData";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ADMINROLES } from "@/lib/types/role";
import { ImagePreviewDialog } from "@/components/ImagePreviewDialog";
import { CommentsSection } from "@/components/CommentSection";

export default function Page() {
  const { id, casinogroup } = useParams();
  const router = useRouter();
  const { remittance, isLoading, error, mutate } = useRemittanceById(
    id as string
  );
  const [value, setValue] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
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

  const handleCommentSend = useCallback(
    async (e: React.FormEvent) => {
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

        const res = await fetch(`/api/remittance/${id}/thread`, {
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
    },
    [inputValue, attachments, id, mutate]
  );

  const isAllowed =
    session?.user.id === remittance?.userId ||
    session?.user?.role === ADMINROLES.ADMIN ||
    session?.user?.role === ADMINROLES.SUPERADMIN ||
    session?.user?.role === ADMINROLES.ACCOUNTING;

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
      ) : remittance ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-y-4 md:gap-x-8">
          {/* Subject */}
          <div>
            <Label className="text-muted-foreground text-xs mb-1 block">
              Subject
            </Label>
            <Input readOnly value={remittance.subject} className="text-sm" />
          </div>

          {/* Entry By */}
          <div>
            <Label className="text-muted-foreground text-xs mb-1 block">
              Entry By
            </Label>
            <Input readOnly value={remittance.user?.name} className="text-sm" />
          </div>

          {/* Details */}
          <div className="md:col-span-1">
            <Label className="text-muted-foreground text-xs mb-1 block">
              Details
            </Label>
            <Textarea
              readOnly
              value={remittance.details ?? ""}
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
                remittance.createdAt
                  ? formatDate(remittance.createdAt, "M/dd/yyyy 'at' hh:mm a")
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
                {Array.isArray(remittance.attachments) &&
                  remittance.attachments.length === 0 && (
                    <li className="text-xs text-muted-foreground italic">
                      No attachments
                    </li>
                  )}
                {Array.isArray(remittance.attachments) &&
                  remittance.attachments.map((att) => (
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

          {/* Admin Actions */}
          <div className="flex flex-col sm:flex-row gap-2 md:col-span-2">
            {isAllowed && (
              <UpdateStatusDialog
                remittanceId={id}
                currentStatus={remittance?.status}
              />
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
        <div className="text-sm text-muted-foreground">
          No remittance found.
        </div>
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
              {remittance && remittance.remittanceThreads.length > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {remittance.remittanceThreads.length}
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
                threads={remittance?.remittanceThreads || []}
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
              threads={remittance?.remittanceThreads || []}
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

      <StatusHistorySheet
        open={showStatusSheet}
        onOpenChange={setShowStatusSheet}
        data={remittance?.remittanceLogs || []}
      />
    </div>
  );
}

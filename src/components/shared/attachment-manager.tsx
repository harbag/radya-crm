"use client";

import React, { useRef, useState, useCallback } from "react";
import { useAttachmentsStore } from "@/store/use-attachments-store";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { EntityType, Attachment } from "@/lib/types";
import {
  Upload,
  X,
  FileText,
  Image as ImageIcon,
  ExternalLink,
  Trash2,
  Link as LinkIcon,
  FolderOpen,
} from "lucide-react";

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function getFileIcon(type: string) {
  if (type.startsWith("image/")) return ImageIcon;
  if (type === "google_drive_link") return FolderOpen;
  return FileText;
}

export default function AttachmentManager({
  entityType,
  entityId,
}: {
  entityType: EntityType;
  entityId: string;
}) {
  const { attachments, addAttachment, addLink, deleteAttachment } =
    useAttachmentsStore();
  const entityAttachments = attachments.filter(
    (a) => a.linkedEntityType === entityType && a.linkedEntityId === entityId
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [linkName, setLinkName] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      for (const file of Array.from(files)) {
        await addAttachment(file, entityType, entityId);
      }
    },
    [addAttachment, entityType, entityId]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const handleAddLink = () => {
    if (linkName.trim() && linkUrl.trim()) {
      addLink(linkName.trim(), linkUrl.trim(), entityType, entityId);
      setLinkName("");
      setLinkUrl("");
      setShowLinkForm(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border-2 border-dashed px-4 py-5 text-center transition-colors",
          dragging
            ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20"
            : "border-zinc-300 hover:border-zinc-400 dark:border-zinc-600 dark:hover:border-zinc-500"
        )}
      >
        <Upload className="h-5 w-5 text-zinc-400" />
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Drop files here or click to upload
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {/* Add link button / form */}
      {!showLinkForm ? (
        <button
          onClick={() => setShowLinkForm(true)}
          className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
        >
          <LinkIcon className="h-3 w-3" />
          Link Google Drive or URL
        </button>
      ) : (
        <div className="space-y-2 rounded-md border border-zinc-200 dark:border-zinc-700 p-2">
          <Input
            placeholder="Link name"
            value={linkName}
            onChange={(e) => setLinkName(e.target.value)}
            className="h-7 text-xs"
          />
          <Input
            placeholder="https://drive.google.com/..."
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            className="h-7 text-xs"
          />
          <div className="flex gap-1.5">
            <Button size="sm" className="h-7 text-xs" onClick={handleAddLink}>
              Add
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setShowLinkForm(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Attachment list */}
      {entityAttachments.length > 0 && (
        <div className="space-y-1.5">
          {entityAttachments.map((att) => (
            <AttachmentRow
              key={att.id}
              attachment={att}
              onDelete={() => deleteAttachment(att.id)}
              onPreview={
                att.type.startsWith("image/")
                  ? () => setPreviewUrl(att.url)
                  : undefined
              }
            />
          ))}
        </div>
      )}

      {/* Image preview dialog */}
      <Dialog
        open={!!previewUrl}
        onOpenChange={(open) => !open && setPreviewUrl(null)}
      >
        <DialogContent className="sm:max-w-2xl p-1">
          {previewUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full rounded-md"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AttachmentRow({
  attachment,
  onDelete,
  onPreview,
}: {
  attachment: Attachment;
  onDelete: () => void;
  onPreview?: () => void;
}) {
  const Icon = getFileIcon(attachment.type);
  const isLink = attachment.type === "google_drive_link";
  const isImage = attachment.type.startsWith("image/");

  return (
    <div className="group flex items-center gap-2 rounded-md border border-zinc-200 dark:border-zinc-700 px-2.5 py-1.5">
      {/* Thumbnail or icon */}
      {isImage && attachment.thumbnailUrl ? (
        <button
          onClick={onPreview}
          className="h-8 w-8 shrink-0 overflow-hidden rounded"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={attachment.thumbnailUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        </button>
      ) : (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-zinc-100 dark:bg-zinc-800">
          <Icon className="h-4 w-4 text-zinc-500" />
        </div>
      )}

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-zinc-700 dark:text-zinc-300">
          {attachment.name}
        </p>
        <p className="text-[10px] text-zinc-400">
          {formatFileSize(attachment.size)}
          {attachment.createdBy && ` · ${attachment.createdBy}`}
        </p>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        {isLink && (
          <a
            href={attachment.url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-700"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
        <button
          onClick={onDelete}
          className="rounded p-1 text-zinc-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

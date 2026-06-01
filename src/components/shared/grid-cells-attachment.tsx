"use client";

import React from "react";
import type { CellContext } from "@tanstack/react-table";
import { useAttachmentsStore } from "@/store/use-attachments-store";
import type { EntityType } from "@/lib/types";
import { Paperclip } from "lucide-react";

export function createAttachmentCell<T extends { id: string }>(
  entityType: EntityType
) {
  return function AttachmentCell({ row }: CellContext<T, unknown>) {
    const attachments = useAttachmentsStore((s) =>
      s.attachments.filter(
        (a) =>
          a.linkedEntityType === entityType &&
          a.linkedEntityId === row.original.id
      )
    );

    if (attachments.length === 0) {
      return (
        <div className="flex h-full w-full items-center px-2 text-sm text-zinc-300">
          &mdash;
        </div>
      );
    }

    const images = attachments.filter((a) => a.type.startsWith("image/"));
    const firstImage = images[0];
    const otherCount = attachments.length - (firstImage ? 1 : 0);

    return (
      <div className="flex h-full w-full items-center gap-1.5 px-2">
        {firstImage?.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={firstImage.thumbnailUrl}
            alt=""
            className="h-6 w-6 rounded object-cover"
          />
        ) : (
          <Paperclip className="h-3.5 w-3.5 text-zinc-400" />
        )}
        {otherCount > 0 && (
          <span className="text-xs text-zinc-500">+{otherCount}</span>
        )}
        {!firstImage && (
          <span className="text-xs text-zinc-500">
            {attachments.length} file{attachments.length > 1 ? "s" : ""}
          </span>
        )}
      </div>
    );
  };
}

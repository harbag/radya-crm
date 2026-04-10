"use client";

import { create } from "zustand";
import type { Attachment, EntityType } from "@/lib/types";
import { useUserStore } from "./use-user-store";

type AttachmentsState = {
  attachments: Attachment[];
  addAttachment: (
    file: File,
    linkedEntityType: EntityType,
    linkedEntityId: string
  ) => Promise<string>;
  addLink: (
    name: string,
    url: string,
    linkedEntityType: EntityType,
    linkedEntityId: string
  ) => string;
  deleteAttachment: (id: string) => void;
  getEntityAttachments: (
    entityType: EntityType,
    entityId: string
  ) => Attachment[];
};

export const useAttachmentsStore = create<AttachmentsState>((set, get) => ({
  attachments: [],

  addAttachment: async (file, linkedEntityType, linkedEntityId) => {
    const id = `att_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const url = URL.createObjectURL(file);
    const isImage = file.type.startsWith("image/");

    const attachment: Attachment = {
      id,
      name: file.name,
      type: file.type,
      size: file.size,
      url,
      thumbnailUrl: isImage ? url : undefined,
      linkedEntityType,
      linkedEntityId,
      createdAt: new Date().toISOString(),
      createdBy: useUserStore.getState().user.name,
    };

    set((s) => ({ attachments: [...s.attachments, attachment] }));
    return id;
  },

  addLink: (name, url, linkedEntityType, linkedEntityId) => {
    const id = `att_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const attachment: Attachment = {
      id,
      name,
      type: "google_drive_link",
      size: 0,
      url,
      linkedEntityType,
      linkedEntityId,
      createdAt: new Date().toISOString(),
      createdBy: useUserStore.getState().user.name,
    };
    set((s) => ({ attachments: [...s.attachments, attachment] }));
    return id;
  },

  deleteAttachment: (id) =>
    set((s) => ({
      attachments: s.attachments.filter((a) => a.id !== id),
    })),

  getEntityAttachments: (entityType, entityId) =>
    get().attachments.filter(
      (a) =>
        a.linkedEntityType === entityType && a.linkedEntityId === entityId
    ),
}));

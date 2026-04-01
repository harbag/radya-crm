import { create } from "zustand";
import type { EntityType } from "@/lib/types";

type DetailPanelState = {
  isOpen: boolean;
  entityType: EntityType | null;
  entityId: string | null;
  open: (type: EntityType, id: string) => void;
  close: () => void;
};

export const useDetailPanelStore = create<DetailPanelState>((set) => ({
  isOpen: false,
  entityType: null,
  entityId: null,

  open: (entityType, entityId) =>
    set({ isOpen: true, entityType, entityId }),

  close: () =>
    set({ isOpen: false, entityType: null, entityId: null }),
}));

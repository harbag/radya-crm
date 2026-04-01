import { create } from "zustand";
import { DEALS, DEAL_STAGE_CONFIG, type Deal, type DealStage } from "@/lib/mock-data";
import { useActivitiesStore } from "./use-activities-store";

type DealsState = {
  deals: Deal[];
  addDeal: (partial: Omit<Deal, "id" | "createdAt">) => string;
  updateDeal: (id: string, updates: Partial<Deal>) => void;
  deleteDeals: (ids: string[]) => void;
  moveDeal: (dealId: string, newStage: DealStage, newIndex: number) => void;
};

export const useDealsStore = create<DealsState>((set) => ({
  deals: DEALS,

  addDeal: (partial) => {
    const id = `d${Date.now()}`;
    set((state) => ({
      deals: [
        ...state.deals,
        {
          ...partial,
          id,
          createdAt: new Date().toISOString().split("T")[0],
        },
      ],
    }));
    return id;
  },

  updateDeal: (id, updates) =>
    set((state) => {
      const existing = state.deals.find((d) => d.id === id);
      if (existing && updates.stage && updates.stage !== existing.stage) {
        const oldLabel = DEAL_STAGE_CONFIG[existing.stage]?.label ?? existing.stage;
        const newLabel = DEAL_STAGE_CONFIG[updates.stage as DealStage]?.label ?? updates.stage;
        useActivitiesStore.getState().addActivity({
          type: "deal_stage_changed",
          description: `Deal "${existing.title}" moved from ${oldLabel} to ${newLabel}`,
          linkedEntityType: "deal",
          linkedEntityId: id,
        });
      }
      if (existing && updates.value !== undefined && updates.value !== existing.value) {
        useActivitiesStore.getState().addActivity({
          type: "deal_stage_changed",
          description: `Deal "${existing.title}" value changed from ${existing.value} to ${updates.value}`,
          linkedEntityType: "deal",
          linkedEntityId: id,
        });
      }
      return {
        deals: state.deals.map((d) =>
          d.id === id ? { ...d, ...updates } : d
        ),
      };
    }),

  deleteDeals: (ids) =>
    set((state) => ({
      deals: state.deals.filter((d) => !ids.includes(d.id)),
    })),

  moveDeal: (dealId, newStage, newIndex) =>
    set((state) => {
      const deal = state.deals.find((d) => d.id === dealId);
      if (!deal) return state;

      if (deal.stage !== newStage) {
        const oldLabel = DEAL_STAGE_CONFIG[deal.stage]?.label ?? deal.stage;
        const newLabel = DEAL_STAGE_CONFIG[newStage]?.label ?? newStage;
        useActivitiesStore.getState().addActivity({
          type: "deal_stage_changed",
          description: `Deal "${deal.title}" moved from ${oldLabel} to ${newLabel}`,
          linkedEntityType: "deal",
          linkedEntityId: dealId,
        });
      }

      const withoutDeal = state.deals.filter((d) => d.id !== dealId);
      const updatedDeal: Deal = { ...deal, stage: newStage };

      const stageDeals = withoutDeal.filter((d) => d.stage === newStage);
      const otherDeals = withoutDeal.filter((d) => d.stage !== newStage);
      stageDeals.splice(newIndex, 0, updatedDeal);
      return { deals: [...otherDeals, ...stageDeals] };
    }),
}));

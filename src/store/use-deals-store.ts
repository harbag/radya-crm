import { create } from "zustand";
import { DEALS, type Deal, type DealStage } from "@/lib/mock-data";

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
    set((state) => ({
      deals: state.deals.map((d) =>
        d.id === id ? { ...d, ...updates } : d
      ),
    })),

  deleteDeals: (ids) =>
    set((state) => ({
      deals: state.deals.filter((d) => !ids.includes(d.id)),
    })),

  moveDeal: (dealId, newStage, newIndex) =>
    set((state) => {
      const deal = state.deals.find((d) => d.id === dealId);
      if (!deal) return state;

      const withoutDeal = state.deals.filter((d) => d.id !== dealId);
      const updatedDeal: Deal = { ...deal, stage: newStage };

      const stageDeals = withoutDeal.filter((d) => d.stage === newStage);
      const otherDeals = withoutDeal.filter((d) => d.stage !== newStage);
      stageDeals.splice(newIndex, 0, updatedDeal);
      return { deals: [...otherDeals, ...stageDeals] };
    }),
}));

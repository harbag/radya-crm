import { create } from "zustand";
import { DEALS, type Deal, type DealStage } from "@/lib/mock-data";

type DealsState = {
  deals: Deal[];
  moveDeal: (dealId: string, newStage: DealStage, newIndex: number) => void;
};

export const useDealsStore = create<DealsState>((set) => ({
  deals: DEALS,

  moveDeal: (dealId, newStage, newIndex) =>
    set((state) => {
      const deal = state.deals.find((d) => d.id === dealId);
      if (!deal) return state;

      const withoutDeal = state.deals.filter((d) => d.id !== dealId);
      const updatedDeal: Deal = { ...deal, stage: newStage };

      if (deal.stage === newStage) {
        // Reorder within the same column
        const stageDeals = withoutDeal.filter((d) => d.stage === newStage);
        const otherDeals = withoutDeal.filter((d) => d.stage !== newStage);
        stageDeals.splice(newIndex, 0, updatedDeal);
        return { deals: [...otherDeals, ...stageDeals] };
      } else {
        // Move to a different column
        const destDeals = withoutDeal.filter((d) => d.stage === newStage);
        const otherDeals = withoutDeal.filter((d) => d.stage !== newStage);
        destDeals.splice(newIndex, 0, updatedDeal);
        return { deals: [...otherDeals, ...destDeals] };
      }
    }),
}));

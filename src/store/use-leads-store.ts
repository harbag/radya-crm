import { create } from "zustand";
import { LEADS, LEAD_STATUS_CONFIG, type Lead, type LeadStatus } from "@/lib/mock-data";
import { useActivitiesStore } from "./use-activities-store";

type LeadsState = {
  leads: Lead[];
  addLead: (partial: Omit<Lead, "id" | "createdAt">) => string;
  updateLead: (id: string, updates: Partial<Lead>) => void;
  deleteLeads: (ids: string[]) => void;
  moveLeadStatus: (leadId: string, newStatus: LeadStatus) => void;
  markConverted: (leadId: string) => void;
};

export const useLeadsStore = create<LeadsState>((set) => ({
  leads: LEADS,

  addLead: (partial) => {
    const id = `l${Date.now()}`;
    set((state) => ({
      leads: [
        ...state.leads,
        {
          ...partial,
          id,
          createdAt: new Date().toISOString().split("T")[0],
        },
      ],
    }));
    return id;
  },

  updateLead: (id, updates) =>
    set((state) => ({
      leads: state.leads.map((l) =>
        l.id === id ? { ...l, ...updates } : l
      ),
    })),

  deleteLeads: (ids) =>
    set((state) => ({
      leads: state.leads.filter((l) => !ids.includes(l.id)),
    })),

  moveLeadStatus: (leadId, newStatus) =>
    set((state) => {
      const lead = state.leads.find((l) => l.id === leadId);
      if (lead && lead.status !== newStatus) {
        const oldLabel = LEAD_STATUS_CONFIG[lead.status]?.label ?? lead.status;
        const newLabel = LEAD_STATUS_CONFIG[newStatus]?.label ?? newStatus;
        useActivitiesStore.getState().addActivity({
          type: "lead_status_changed",
          description: `Lead "${lead.title}" status changed from ${oldLabel} to ${newLabel}`,
          linkedEntityType: "lead",
          linkedEntityId: leadId,
        });
      }
      return {
        leads: state.leads.map((l) =>
          l.id === leadId ? { ...l, status: newStatus } : l
        ),
      };
    }),

  markConverted: (leadId) =>
    set((state) => ({
      leads: state.leads.filter((l) => l.id !== leadId),
    })),
}));

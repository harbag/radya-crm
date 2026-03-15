import { create } from "zustand";
import { LEADS, type Lead, type LeadStatus } from "@/lib/mock-data";

type LeadsState = {
  leads: Lead[];
  addLead: (partial: Omit<Lead, "id" | "createdAt">) => string;
  updateLead: (id: string, updates: Partial<Lead>) => void;
  deleteLeads: (ids: string[]) => void;
  moveLeadStatus: (leadId: string, newStatus: LeadStatus) => void;
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
    set((state) => ({
      leads: state.leads.map((l) =>
        l.id === leadId ? { ...l, status: newStatus } : l
      ),
    })),
}));

import { create } from "zustand";
import { COMPANIES, type Company } from "@/lib/mock-data";
import { useUserStore } from "./use-user-store";

type CompaniesState = {
  companies: Company[];
  addCompany: (partial: Omit<Company, "id" | "createdAt" | "createdBy" | "lastModifiedBy" | "lastModifiedAt">) => string;
  updateCompany: (id: string, updates: Partial<Company>) => void;
  deleteCompanies: (ids: string[]) => void;
};

export const useCompaniesStore = create<CompaniesState>((set) => ({
  companies: COMPANIES,

  addCompany: (partial) => {
    const id = `comp${Date.now()}`;
    const now = new Date().toISOString();
    const userName = useUserStore.getState().user.name;
    set((state) => ({
      companies: [
        ...state.companies,
        {
          ...partial,
          id,
          createdAt: now,
          createdBy: userName,
          lastModifiedBy: userName,
          lastModifiedAt: now,
        },
      ],
    }));
    return id;
  },

  updateCompany: (id, updates) =>
    set((state) => ({
      companies: state.companies.map((c) =>
        c.id === id ? { ...c, ...updates, lastModifiedBy: useUserStore.getState().user.name, lastModifiedAt: new Date().toISOString() } : c
      ),
    })),

  deleteCompanies: (ids) =>
    set((state) => ({
      companies: state.companies.filter((c) => !ids.includes(c.id)),
    })),
}));

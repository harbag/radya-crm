import { create } from "zustand";
import { COMPANIES, type Company } from "@/lib/mock-data";

type CompaniesState = {
  companies: Company[];
  addCompany: (partial: Omit<Company, "id" | "createdAt">) => string;
  updateCompany: (id: string, updates: Partial<Company>) => void;
  deleteCompanies: (ids: string[]) => void;
};

export const useCompaniesStore = create<CompaniesState>((set) => ({
  companies: COMPANIES,

  addCompany: (partial) => {
    const id = `comp${Date.now()}`;
    set((state) => ({
      companies: [
        ...state.companies,
        {
          ...partial,
          id,
          createdAt: new Date().toISOString().split("T")[0],
        },
      ],
    }));
    return id;
  },

  updateCompany: (id, updates) =>
    set((state) => ({
      companies: state.companies.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    })),

  deleteCompanies: (ids) =>
    set((state) => ({
      companies: state.companies.filter((c) => !ids.includes(c.id)),
    })),
}));

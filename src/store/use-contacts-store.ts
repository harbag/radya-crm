import { create } from "zustand";
import { CONTACTS, type Contact, type ContactStatus } from "@/lib/mock-data";

type ContactsState = {
  contacts: Contact[];
  addContact: (partial: Omit<Contact, "id" | "createdAt">) => string;
  updateContact: (id: string, updates: Partial<Contact>) => void;
  deleteContacts: (ids: string[]) => void;
};

export const useContactsStore = create<ContactsState>((set) => ({
  contacts: CONTACTS,

  addContact: (partial) => {
    const id = `c${Date.now()}`;
    set((state) => ({
      contacts: [
        ...state.contacts,
        {
          ...partial,
          id,
          createdAt: new Date().toISOString().split("T")[0],
        },
      ],
    }));
    return id;
  },

  updateContact: (id, updates) =>
    set((state) => ({
      contacts: state.contacts.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    })),

  deleteContacts: (ids) =>
    set((state) => ({
      contacts: state.contacts.filter((c) => !ids.includes(c.id)),
    })),
}));

export type { ContactStatus };

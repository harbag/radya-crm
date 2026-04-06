import { create } from "zustand";
import { CONTACTS, type Contact, type ContactStatus } from "@/lib/mock-data";
import { useUserStore } from "./use-user-store";

type ContactsState = {
  contacts: Contact[];
  addContact: (partial: Omit<Contact, "id" | "createdAt" | "createdBy" | "lastModifiedBy" | "lastModifiedAt">) => string;
  updateContact: (id: string, updates: Partial<Contact>) => void;
  deleteContacts: (ids: string[]) => void;
};

export const useContactsStore = create<ContactsState>((set) => ({
  contacts: CONTACTS,

  addContact: (partial) => {
    const id = `c${Date.now()}`;
    const now = new Date().toISOString();
    const userName = useUserStore.getState().user.name;
    set((state) => ({
      contacts: [
        ...state.contacts,
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

  updateContact: (id, updates) =>
    set((state) => ({
      contacts: state.contacts.map((c) =>
        c.id === id ? { ...c, ...updates, lastModifiedBy: useUserStore.getState().user.name, lastModifiedAt: new Date().toISOString() } : c
      ),
    })),

  deleteContacts: (ids) =>
    set((state) => ({
      contacts: state.contacts.filter((c) => !ids.includes(c.id)),
    })),
}));

export type { ContactStatus };

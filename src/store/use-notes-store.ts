import { create } from "zustand";
import { NOTES, type Note } from "@/lib/mock-data";

type NotesState = {
  notes: Note[];
  addNote: (partial: Omit<Note, "id" | "createdAt">) => string;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
};

export const useNotesStore = create<NotesState>((set) => ({
  notes: NOTES,

  addNote: (partial) => {
    const id = `n${Date.now()}`;
    set((state) => ({
      notes: [
        ...state.notes,
        {
          ...partial,
          id,
          createdAt: new Date().toISOString().split("T")[0],
        },
      ],
    }));
    return id;
  },

  updateNote: (id, updates) =>
    set((state) => ({
      notes: state.notes.map((n) =>
        n.id === id ? { ...n, ...updates } : n
      ),
    })),

  deleteNote: (id) =>
    set((state) => ({
      notes: state.notes.filter((n) => n.id !== id),
    })),
}));

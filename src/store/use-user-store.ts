"use client";

import { create } from "zustand";

export type User = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type UserState = {
  user: User;
  updateProfile: (updates: Partial<Omit<User, "id">>) => void;
};

export const useUserStore = create<UserState>((set) => ({
  user: {
    id: "user_1",
    name: "Andi Pratama",
    email: "andi@radya.co",
    role: "Admin",
  },
  updateProfile: (updates) =>
    set((s) => ({ user: { ...s.user, ...updates } })),
}));

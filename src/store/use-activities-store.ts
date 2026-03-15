import { create } from "zustand";
import { ACTIVITIES, type Activity } from "@/lib/mock-data";

type ActivitiesState = {
  activities: Activity[];
  addActivity: (partial: Omit<Activity, "id" | "createdAt">) => void;
};

export const useActivitiesStore = create<ActivitiesState>((set) => ({
  activities: ACTIVITIES,

  addActivity: (partial) =>
    set((state) => ({
      activities: [
        {
          ...partial,
          id: `a${Date.now()}`,
          createdAt: new Date().toISOString().split("T")[0],
        },
        ...state.activities,
      ],
    })),
}));

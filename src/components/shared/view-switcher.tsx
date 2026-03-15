"use client";

import React from "react";
import { cn } from "@/lib/utils";
import {
  LayoutGrid,
  KanbanSquare,
  Calendar,
  type LucideIcon,
} from "lucide-react";

export type ViewType = "grid" | "kanban" | "calendar";

type ViewOption = {
  id: ViewType;
  label: string;
  icon: LucideIcon;
};

const ALL_VIEWS: ViewOption[] = [
  { id: "grid", label: "Grid", icon: LayoutGrid },
  { id: "kanban", label: "Kanban", icon: KanbanSquare },
  { id: "calendar", label: "Calendar", icon: Calendar },
];

type ViewSwitcherProps = {
  current: ViewType;
  onChange: (view: ViewType) => void;
  views?: ViewType[];
};

export default function ViewSwitcher({
  current,
  onChange,
  views = ["grid", "kanban", "calendar"],
}: ViewSwitcherProps) {
  const available = ALL_VIEWS.filter((v) => views.includes(v.id));

  return (
    <div className="inline-flex items-center rounded-lg border border-zinc-200 bg-zinc-50 p-0.5">
      {available.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
            current === id
              ? "bg-white text-zinc-900 shadow-sm"
              : "text-zinc-500 hover:text-zinc-700"
          )}
        >
          <Icon className="h-3.5 w-3.5" />
          {label}
        </button>
      ))}
    </div>
  );
}

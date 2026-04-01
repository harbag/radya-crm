"use client";

import React from "react";
import { cn } from "@/lib/utils";
import type { EntityType } from "@/lib/types";
import {
  Users,
  Building2,
  Target,
  KanbanSquare,
  CheckSquare,
} from "lucide-react";

const ENTITY_ICONS: Record<EntityType, typeof Users> = {
  contact: Users,
  company: Building2,
  lead: Target,
  deal: KanbanSquare,
  task: CheckSquare,
};

const ENTITY_COLORS: Record<EntityType, string> = {
  contact: "bg-indigo-100 text-indigo-600",
  company: "bg-emerald-100 text-emerald-600",
  lead: "bg-amber-100 text-amber-600",
  deal: "bg-blue-100 text-blue-600",
  task: "bg-purple-100 text-purple-600",
};

export default function EntityHeader({
  entityType,
  name,
  subtitle,
}: {
  entityType: EntityType;
  name: string;
  subtitle?: string;
}) {
  const Icon = ENTITY_ICONS[entityType];
  const colorClass = ENTITY_COLORS[entityType];
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold",
          colorClass
        )}
      >
        {initials || <Icon className="h-5 w-5" />}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-lg font-semibold text-zinc-900 truncate">{name}</h3>
        {subtitle && (
          <p className="text-sm text-zinc-500 truncate">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

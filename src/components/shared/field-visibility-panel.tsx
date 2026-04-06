"use client";

import React, { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { EyeOff, Eye, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { VisibilityState } from "@tanstack/react-table";

// ── Types ───────────────────────────────────────────────────────────────────

export type FieldInfo = {
  id: string;
  label: string;
  /** If true, field cannot be hidden (primary field) */
  locked?: boolean;
};

type FieldVisibilityPanelProps = {
  fields: FieldInfo[];
  columnVisibility: VisibilityState;
  onColumnVisibilityChange: (vis: VisibilityState) => void;
};

// ── Component ───────────────────────────────────────────────────────────────

export default function FieldVisibilityPanel({
  fields,
  columnVisibility,
  onColumnVisibilityChange,
}: FieldVisibilityPanelProps) {
  const [search, setSearch] = useState("");

  const hiddenCount = fields.filter(
    (f) => !f.locked && columnVisibility[f.id] === false
  ).length;

  const filteredFields = fields.filter((f) =>
    f.label.toLowerCase().includes(search.toLowerCase())
  );

  function toggleField(id: string) {
    const current = columnVisibility[id] ?? true;
    onColumnVisibilityChange({ ...columnVisibility, [id]: !current });
  }

  function hideAll() {
    const next: VisibilityState = { ...columnVisibility };
    for (const f of fields) {
      if (!f.locked) next[f.id] = false;
    }
    onColumnVisibilityChange(next);
  }

  function showAll() {
    const next: VisibilityState = { ...columnVisibility };
    for (const f of fields) {
      if (!f.locked) next[f.id] = true;
    }
    onColumnVisibilityChange(next);
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition-colors",
            hiddenCount > 0
              ? "border-indigo-300 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
              : "border-border bg-background text-muted-foreground hover:bg-muted"
          )}
        >
          <EyeOff className="h-3.5 w-3.5" />
          {hiddenCount > 0 ? `${hiddenCount} hidden` : "Hide fields"}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start" sideOffset={4}>
        {/* Search */}
        <div className="border-b border-zinc-100 p-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
            <Input
              placeholder="Find a field"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-7 pl-7 text-xs"
            />
          </div>
        </div>

        {/* Bulk actions */}
        <div className="flex items-center justify-between border-b border-zinc-100 px-3 py-1.5">
          <button
            onClick={hideAll}
            className="text-[11px] font-medium text-zinc-500 hover:text-zinc-700"
          >
            Hide all
          </button>
          <button
            onClick={showAll}
            className="text-[11px] font-medium text-indigo-600 hover:text-indigo-700"
          >
            Show all
          </button>
        </div>

        {/* Field list */}
        <div className="max-h-64 overflow-y-auto py-1">
          {filteredFields.map((field) => {
            const isVisible = columnVisibility[field.id] !== false;
            return (
              <button
                key={field.id}
                disabled={field.locked}
                onClick={() => toggleField(field.id)}
                className={cn(
                  "flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-xs transition-colors",
                  field.locked
                    ? "cursor-not-allowed text-zinc-400"
                    : "cursor-pointer hover:bg-zinc-50 text-zinc-700"
                )}
              >
                {/* Toggle indicator */}
                <div
                  className={cn(
                    "flex h-4 w-7 shrink-0 items-center rounded-full px-0.5 transition-colors",
                    isVisible ? "bg-indigo-500" : "bg-zinc-300",
                    field.locked && "opacity-50"
                  )}
                >
                  <div
                    className={cn(
                      "h-3 w-3 rounded-full bg-white shadow-sm transition-transform",
                      isVisible && "translate-x-3"
                    )}
                  />
                </div>
                <span className="truncate">{field.label}</span>
                {field.locked && (
                  <Eye className="ml-auto h-3 w-3 shrink-0 text-zinc-400" />
                )}
              </button>
            );
          })}
          {filteredFields.length === 0 && (
            <p className="px-3 py-4 text-center text-xs text-zinc-400">
              No fields match
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

"use client";

import React, { useRef } from "react";
import type { CellContext, RowData } from "@tanstack/react-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/mock-data";

// ── Types ─────────────────────────────────────────────────────────────────────
export type EditingCell = { rowId: string; columnId: string };
export type CellType = "text" | "dropdown" | "readonly";

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface TableMeta<TData extends RowData> {
    editingCell: EditingCell | null;
    setEditingCell: React.Dispatch<React.SetStateAction<EditingCell | null>>;
    selectedCell: EditingCell | null;
    setSelectedCell: React.Dispatch<React.SetStateAction<EditingCell | null>>;
    onUpdate: (id: string, updates: Record<string, unknown>) => void;
    commitEdit: (action: "enter" | "tab" | "shift-tab" | "escape") => void;
    initialCharRef: React.MutableRefObject<string | null>;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    cellType?: CellType;
  }
}

// ── Editable Text Cell ────────────────────────────────────────────────────────
export function EditableTextCell<T extends { id: string }>({
  getValue,
  row,
  column,
  table,
}: CellContext<T, string>) {
  const { editingCell, onUpdate, commitEdit, initialCharRef } =
    table.options.meta!;
  const isEditing =
    editingCell?.rowId === row.id && editingCell?.columnId === column.id;
  const value = getValue() ?? "";
  const savedRef = useRef(false);

  if (isEditing) {
    // Read and clear initial char (for type-to-edit)
    const initialChar = initialCharRef.current;
    initialCharRef.current = null;

    return (
      <input
        className="h-full w-full bg-white px-2 text-sm outline-none"
        defaultValue={initialChar ?? value}
        autoFocus
        ref={(el) => {
          if (el && initialChar) {
            // Place cursor at end when type-to-edit
            el.setSelectionRange(el.value.length, el.value.length);
          }
        }}
        onBlur={(e) => {
          // Fallback save for click-outside
          if (!savedRef.current && e.target.value !== value) {
            onUpdate(row.original.id, { [column.id]: e.target.value });
          }
          savedRef.current = false;
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            const newVal = e.currentTarget.value;
            if (newVal !== value) {
              onUpdate(row.original.id, { [column.id]: newVal });
              savedRef.current = true;
            }
            commitEdit("enter");
          } else if (e.key === "Escape") {
            e.preventDefault();
            savedRef.current = true; // skip save on blur
            commitEdit("escape");
          } else if (e.key === "Tab") {
            e.preventDefault();
            const newVal = e.currentTarget.value;
            if (newVal !== value) {
              onUpdate(row.original.id, { [column.id]: newVal });
              savedRef.current = true;
            }
            commitEdit(e.shiftKey ? "shift-tab" : "tab");
          }
        }}
      />
    );
  }

  // Display mode — no onClick, selection handled by <td>
  return (
    <div className="flex h-full w-full cursor-default items-center px-2 text-sm">
      {value ? (
        <span className="truncate">{value}</span>
      ) : (
        <span className="text-zinc-300">&mdash;</span>
      )}
    </div>
  );
}

// ── Status Badge Cell ─────────────────────────────────────────────────────────
type StatusConfig = Record<string, { label: string; className: string }>;

export function createStatusBadgeCell<T extends { id: string }>(
  config: StatusConfig,
  fieldName: string
) {
  return function StatusBadgeCell({
    getValue,
    row,
    column,
    table,
  }: CellContext<T, string>) {
    const { editingCell, onUpdate, commitEdit } = table.options.meta!;
    const isEditing =
      editingCell?.rowId === row.id && editingCell?.columnId === column.id;
    const status = getValue();
    const cfg = config[status];

    if (!isEditing) {
      // Display-only badge
      return (
        <div className="flex h-full w-full items-center px-2 text-sm">
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
              cfg?.className
            )}
          >
            {cfg?.label ?? status}
          </span>
        </div>
      );
    }

    // Editing: render open Select
    return (
      <Select
        open
        value={status}
        onValueChange={(val) => {
          onUpdate(row.original.id, { [fieldName]: val });
          commitEdit("enter");
        }}
        onOpenChange={(open) => {
          if (!open) commitEdit("escape");
        }}
      >
        <SelectTrigger className="h-full w-full rounded-none border-0 px-2 shadow-none focus:ring-0 text-sm">
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
              cfg?.className
            )}
          >
            {cfg?.label ?? status}
          </span>
        </SelectTrigger>
        <SelectContent>
          {Object.entries(config).map(([key, val]) => (
            <SelectItem key={key} value={key}>
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                  val.className
                )}
              >
                {val.label}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  };
}

// ── Date Cell ─────────────────────────────────────────────────────────────────
export function DateCell<T extends { id: string }>({
  getValue,
}: CellContext<T, string>) {
  const value = getValue();
  return (
    <div className="flex h-full w-full items-center px-2 text-sm text-zinc-500">
      {value
        ? new Date(value).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
        : "\u2014"}
    </div>
  );
}

// ── Currency Cell ─────────────────────────────────────────────────────────────
export function CurrencyCell<T extends { id: string }>({
  getValue,
}: CellContext<T, number>) {
  const value = getValue();
  return (
    <div className="flex h-full w-full items-center px-2 text-sm font-medium text-zinc-700">
      {value != null ? formatCurrency(value) : "\u2014"}
    </div>
  );
}

// ── Relation Cell (FK lookup) ─────────────────────────────────────────────────
export function createRelationCell<T extends { id: string }>(
  getItems: () => { id: string; name: string }[],
  fieldName: string
) {
  return function RelationCell({
    getValue,
    row,
    column,
    table,
  }: CellContext<T, string | null>) {
    const { editingCell, onUpdate, commitEdit } = table.options.meta!;
    const isEditing =
      editingCell?.rowId === row.id && editingCell?.columnId === column.id;
    const currentId = getValue();
    const items = getItems();
    const current = items.find((i) => i.id === currentId);

    if (!isEditing) {
      // Display-only
      return (
        <div className="flex h-full w-full items-center px-2 text-sm">
          <span className="truncate">
            {current?.name ?? (
              <span className="text-zinc-300">&mdash;</span>
            )}
          </span>
        </div>
      );
    }

    // Editing: render open Select
    return (
      <Select
        open
        value={currentId ?? "none"}
        onValueChange={(val) => {
          onUpdate(row.original.id, {
            [fieldName]: val === "none" ? null : val,
          });
          commitEdit("enter");
        }}
        onOpenChange={(open) => {
          if (!open) commitEdit("escape");
        }}
      >
        <SelectTrigger className="h-full w-full rounded-none border-0 px-2 shadow-none focus:ring-0 text-sm">
          <span className="truncate">
            {current?.name ?? (
              <span className="text-zinc-300">&mdash;</span>
            )}
          </span>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">
            <span className="text-zinc-400">None</span>
          </SelectItem>
          {items.map((item) => (
            <SelectItem key={item.id} value={item.id}>
              {item.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  };
}

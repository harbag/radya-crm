"use client";

import React from "react";
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

// ── TableMeta augmentation ─────────────────────────────────────────────────
export type EditingCell = { rowId: string; columnId: string };

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface TableMeta<TData extends RowData> {
    editingCell: EditingCell | null;
    setEditingCell: React.Dispatch<React.SetStateAction<EditingCell | null>>;
    onUpdate: (id: string, updates: Record<string, unknown>) => void;
  }
}

// ── Editable Text Cell ─────────────────────────────────────────────────────
export function EditableTextCell<T extends { id: string }>({
  getValue,
  row,
  column,
  table,
}: CellContext<T, string>) {
  const { editingCell, setEditingCell, onUpdate } = table.options.meta!;
  const isEditing =
    editingCell?.rowId === row.id && editingCell?.columnId === column.id;
  const value = getValue() ?? "";

  if (isEditing) {
    return (
      <input
        className="h-full w-full bg-white px-2 text-sm outline-none"
        defaultValue={value}
        autoFocus
        onBlur={(e) => {
          if (e.target.value !== value) {
            onUpdate(row.original.id, { [column.id]: e.target.value });
          }
          setEditingCell(null);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") setEditingCell(null);
          if (e.key === "Tab") {
            e.preventDefault();
            e.currentTarget.blur();
          }
        }}
      />
    );
  }

  return (
    <div
      className="flex h-full w-full cursor-default items-center px-2 text-sm"
      onClick={() => setEditingCell({ rowId: row.id, columnId: column.id })}
    >
      {value ? (
        <span className="truncate">{value}</span>
      ) : (
        <span className="text-zinc-300">&mdash;</span>
      )}
    </div>
  );
}

// ── Status Badge Cell ──────────────────────────────────────────────────────
type StatusConfig = Record<string, { label: string; className: string }>;

export function createStatusBadgeCell<T extends { id: string }>(
  config: StatusConfig,
  fieldName: string
) {
  return function StatusBadgeCell({
    getValue,
    row,
    table,
  }: CellContext<T, string>) {
    const { onUpdate } = table.options.meta!;
    const status = getValue();
    const cfg = config[status];

    return (
      <Select
        value={status}
        onValueChange={(val) => onUpdate(row.original.id, { [fieldName]: val })}
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

// ── Date Cell ──────────────────────────────────────────────────────────────
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

// ── Currency Cell ──────────────────────────────────────────────────────────
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

// ── Relation Cell (FK lookup) ──────────────────────────────────────────────
export function createRelationCell<T extends { id: string }>(
  getItems: () => { id: string; name: string }[],
  fieldName: string
) {
  return function RelationCell({
    getValue,
    row,
    table,
  }: CellContext<T, string | null>) {
    const { onUpdate } = table.options.meta!;
    const currentId = getValue();
    const items = getItems();
    const current = items.find((i) => i.id === currentId);

    return (
      <Select
        value={currentId ?? "none"}
        onValueChange={(val) =>
          onUpdate(row.original.id, {
            [fieldName]: val === "none" ? null : val,
          })
        }
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

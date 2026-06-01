"use client";

import React, { useRef, useState, useCallback } from "react";
import type { CellContext, RowData } from "@tanstack/react-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/mock-data";
import { Maximize2 } from "lucide-react";

import type { FilterDataType } from "./filter-builder";

// ── Types ─────────────────────────────────────────────────────────────────────
export type EditingCell = { rowId: string; columnId: string };
export type CellType = "text" | "dropdown" | "readonly" | "longtext";

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
    /** When true, text cells wrap to multiple lines (top-aligned) instead of truncating. */
    wrapText?: boolean;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    cellType?: CellType;
    dataType?: FilterDataType;
    selectOptions?: { value: string; label: string }[];
  }
}

// ── Editable Text Cell ────────────────────────────────────────────────────────
export function EditableTextCell<T extends { id: string }>({
  getValue,
  row,
  column,
  table,
}: CellContext<T, string>) {
  const { editingCell, onUpdate, commitEdit, initialCharRef, wrapText } =
    table.options.meta!;
  const isEditing =
    editingCell?.rowId === row.id && editingCell?.columnId === column.id;
  const value = getValue() ?? "";
  const savedRef = useRef(false);

  if (isEditing) {
    return (
      <input
        className="h-full w-full bg-background px-2 text-sm outline-none"
        defaultValue={value}
        autoFocus
        ref={(el) => {
          if (!el) return;
          // Apply the type-to-edit initial char here: reading/clearing the ref
          // in the ref callback runs at commit time, not during render.
          const initialChar = initialCharRef.current;
          initialCharRef.current = null;
          if (initialChar) {
            el.value = initialChar;
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
    <div
      className={cn(
        "flex h-full w-full cursor-default px-2 text-sm",
        wrapText ? "items-start py-1.5" : "items-center"
      )}
    >
      {value ? (
        <span
          className={wrapText ? "whitespace-normal break-words line-clamp-3" : "truncate"}
        >
          {value}
        </span>
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

// ── Long Text Cell (expandable multi-line) ───────────────────────────────────
export function LongTextCell<T extends { id: string }>({
  getValue,
  row,
  column,
  table,
}: CellContext<T, string>) {
  const { editingCell, onUpdate, commitEdit, initialCharRef, wrapText } =
    table.options.meta!;
  const isEditing =
    editingCell?.rowId === row.id && editingCell?.columnId === column.id;
  const value = getValue() ?? "";
  const savedRef = useRef(false);
  const [expandedOpen, setExpandedOpen] = useState(false);
  const [expandedValue, setExpandedValue] = useState(value);

  const handleOpenExpanded = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setExpandedValue(value);
      setExpandedOpen(true);
    },
    [value]
  );

  const handleSaveExpanded = useCallback(() => {
    if (expandedValue !== value) {
      onUpdate(row.original.id, { [column.id]: expandedValue });
    }
    setExpandedOpen(false);
  }, [expandedValue, value, onUpdate, row.original.id, column.id]);

  if (isEditing && !expandedOpen) {
    return (
      <input
        className="h-full w-full bg-background px-2 text-sm outline-none"
        defaultValue={value}
        autoFocus
        ref={(el) => {
          if (!el) return;
          const initialChar = initialCharRef.current;
          initialCharRef.current = null;
          if (initialChar) {
            el.value = initialChar;
            el.setSelectionRange(el.value.length, el.value.length);
          }
        }}
        onBlur={(e) => {
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
            savedRef.current = true;
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

  return (
    <>
      <div
        className={cn(
          "group/longtext flex h-full w-full cursor-default px-2 text-sm",
          wrapText ? "items-start py-1.5" : "items-center"
        )}
      >
        {value ? (
          <span
            className={cn(
              "flex-1",
              wrapText
                ? "whitespace-normal break-words line-clamp-3"
                : "truncate whitespace-pre-line line-clamp-1"
            )}
          >
            {value}
          </span>
        ) : (
          <span className="text-zinc-300">&mdash;</span>
        )}
        <button
          onClick={handleOpenExpanded}
          className="ml-1 shrink-0 opacity-0 transition-opacity group-hover/longtext:opacity-100"
          title="Expand (Shift+Space)"
        >
          <Maximize2 className="h-3 w-3 text-zinc-400 hover:text-zinc-600" />
        </button>
      </div>

      <Dialog open={expandedOpen} onOpenChange={setExpandedOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm font-medium text-zinc-700">
              {typeof column.columnDef.header === "string"
                ? column.columnDef.header
                : column.id}
            </DialogTitle>
          </DialogHeader>
          <Textarea
            value={expandedValue}
            onChange={(e) => setExpandedValue(e.target.value)}
            className="min-h-[160px] text-sm"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExpandedOpen(false)}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveExpanded}>
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── DateTime Cell (full timestamp) ───────────────────────────────────────────
export function DateTimeCell<T extends { id: string }>({
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
            hour: "2-digit",
            minute: "2-digit",
          })
        : "\u2014"}
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

// ── Avatar + Name Cell ───────────────────────────────────────────────────────
export function createAvatarNameCell<T extends { id: string }>(
  getImageUrl: (row: T) => string | undefined,
  bgColor: string = "bg-indigo-100",
  textColor: string = "text-indigo-700"
) {
  return function AvatarNameCell({
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
    const imageUrl = getImageUrl(row.original);

    if (isEditing) {
      return (
        <input
          className="h-full w-full bg-background px-2 text-sm outline-none"
          defaultValue={value}
          autoFocus
          ref={(el) => {
            if (!el) return;
            const initialChar = initialCharRef.current;
            initialCharRef.current = null;
            if (initialChar) {
              el.value = initialChar;
              el.setSelectionRange(el.value.length, el.value.length);
            }
          }}
          onBlur={(e) => {
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
              savedRef.current = true;
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

    const initials = value
      ? value
          .split(" ")
          .map((w: string) => w[0])
          .slice(0, 2)
          .join("")
          .toUpperCase()
      : "";

    return (
      <div className="flex h-full w-full cursor-default items-center gap-2 px-2 text-sm">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt=""
            className="h-5 w-5 shrink-0 rounded-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : initials ? (
          <div
            className={cn(
              "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold",
              bgColor,
              textColor
            )}
          >
            {initials}
          </div>
        ) : null}
        {value ? (
          <span className="truncate">{value}</span>
        ) : (
          <span className="text-zinc-300">&mdash;</span>
        )}
      </div>
    );
  };
}

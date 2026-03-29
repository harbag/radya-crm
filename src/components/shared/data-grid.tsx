"use client";

import React, { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type RowSelectionState,
} from "@tanstack/react-table";
import type { EditingCell, CellType } from "./grid-cells";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Search,
  MoreHorizontal,
  ChevronsUpDown,
  type LucideIcon,
} from "lucide-react";

// ── Types ───────────────────────────────────────────────────────────────────
export type FilterOption = {
  id: string;
  label: string;
  options: { value: string; label: string }[];
};

export type RowAction<T> = {
  label: string;
  icon?: LucideIcon;
  onClick: (row: T) => void;
  className?: string;
};

type DataGridProps<T extends { id: string }> = {
  data: T[];
  columns: ColumnDef<T, any>[];
  columnWidths: Record<string, number>;
  entityName: string;
  entityIcon: LucideIcon;
  onAdd?: () => string;
  onUpdate: (id: string, updates: Record<string, unknown>) => void;
  onDelete: (ids: string[]) => void;
  onRowClick?: (row: T) => void;
  filterOptions?: FilterOption[];
  toolbarExtra?: React.ReactNode;
  addLabel?: string;
  rowActions?: RowAction<T>[];
};

const SYSTEM_COLS = new Set(["select", "rowNum", "actions"]);

// ── Component ───────────────────────────────────────────────────────────────
export default function DataGrid<T extends { id: string }>({
  data,
  columns: userColumns,
  columnWidths,
  entityName,
  entityIcon: EntityIcon,
  onAdd,
  onUpdate,
  onDelete,
  onRowClick,
  filterOptions = [],
  toolbarExtra,
  addLabel,
  rowActions = [],
}: DataGridProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [selectedCell, setSelectedCell] = useState<EditingCell | null>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const initialCharRef = useRef<string | null>(null);
  const prevRowCountRef = useRef<number>(0);

  // Derive navigable column IDs from user columns
  const userColumnIds = useMemo(
    () =>
      userColumns
        .map((col) => (col as any).accessorKey ?? col.id)
        .filter(Boolean) as string[],
    [userColumns]
  );

  // Build full column list: select + rowNum + user columns + actions
  const columns: ColumnDef<T, any>[] = [
    {
      id: "select",
      size: columnWidths.select ?? 40,
      enableSorting: false,
      enableColumnFilter: false,
      header: ({ table }) => (
        <input
          type="checkbox"
          className="rounded border-zinc-300 cursor-pointer"
          checked={table.getIsAllRowsSelected()}
          ref={(el) => {
            if (el) el.indeterminate = table.getIsSomeRowsSelected();
          }}
          onChange={table.getToggleAllRowsSelectedHandler()}
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          className="rounded border-zinc-300 cursor-pointer"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
          onClick={(e) => e.stopPropagation()}
        />
      ),
    },
    {
      id: "rowNum",
      size: columnWidths.rowNum ?? 40,
      enableSorting: false,
      enableColumnFilter: false,
      header: () => null,
      cell: ({ row, table: tbl }) => {
        const { selectedCell: sel } = tbl.options.meta!;
        const isHighlighted = sel?.rowId === row.id;
        return (
          <span
            className={cn(
              "select-none text-xs",
              isHighlighted
                ? "font-semibold text-indigo-600"
                : "text-zinc-400"
            )}
          >
            {row.index + 1}
          </span>
        );
      },
    },
    ...userColumns,
    {
      id: "actions",
      size: columnWidths.actions ?? 44,
      enableSorting: false,
      enableColumnFilter: false,
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex h-full w-full items-center justify-center text-zinc-400 opacity-0 transition-opacity group-hover:opacity-100 hover:text-zinc-700">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {rowActions.map((action) => {
              const ActionIcon = action.icon;
              return (
                <DropdownMenuItem
                  key={action.label}
                  className={cn("cursor-pointer", action.className)}
                  onClick={() => action.onClick(row.original)}
                >
                  {ActionIcon && <ActionIcon className="mr-2 h-4 w-4" />}
                  {action.label}
                </DropdownMenuItem>
              );
            })}
            <DropdownMenuItem
              className="text-destructive focus:text-destructive cursor-pointer"
              onClick={() => onDelete([row.original.id])}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete row
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getRowId: (row) => row.id,
    state: { sorting, columnFilters, globalFilter, rowSelection },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    enableRowSelection: true,
    meta: {
      editingCell,
      setEditingCell,
      selectedCell,
      setSelectedCell,
      onUpdate,
      commitEdit,
      initialCharRef,
    },
  });

  // Derive row IDs from current (filtered/sorted) model
  const rowIds = useMemo(
    () => table.getRowModel().rows.map((r) => r.id),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [table.getRowModel().rows]
  );

  // ── Row virtualization ──────────────────────────────────────────────────

  const rows = table.getRowModel().rows;

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => 36,
    overscan: 10,
  });

  const virtualRows = virtualizer.getVirtualItems();
  const totalHeight = virtualizer.getTotalSize();
  const allColumnCount = table.getAllColumns().length;

  // Scroll to new row when added
  useEffect(() => {
    if (rows.length > prevRowCountRef.current && rows.length > 0) {
      requestAnimationFrame(() => {
        virtualizer.scrollToIndex(rows.length - 1, { align: "end" });
      });
    }
    prevRowCountRef.current = rows.length;
  }, [rows.length, virtualizer]);

  // ── Navigation helpers ──────────────────────────────────────────────────

  function getAdjacentCell(
    current: EditingCell,
    direction: "up" | "down" | "left" | "right"
  ): EditingCell | null {
    const colIdx = userColumnIds.indexOf(current.columnId);
    const rowIdx = rowIds.indexOf(current.rowId);
    if (colIdx === -1 || rowIdx === -1) return null;

    switch (direction) {
      case "up":
        return rowIdx > 0
          ? { rowId: rowIds[rowIdx - 1], columnId: current.columnId }
          : null;
      case "down":
        return rowIdx < rowIds.length - 1
          ? { rowId: rowIds[rowIdx + 1], columnId: current.columnId }
          : null;
      case "left":
        return colIdx > 0
          ? { rowId: current.rowId, columnId: userColumnIds[colIdx - 1] }
          : null;
      case "right":
        return colIdx < userColumnIds.length - 1
          ? { rowId: current.rowId, columnId: userColumnIds[colIdx + 1] }
          : null;
    }
  }

  function getTabCell(
    current: EditingCell,
    reverse: boolean
  ): EditingCell | null {
    const colIdx = userColumnIds.indexOf(current.columnId);
    const rowIdx = rowIds.indexOf(current.rowId);

    if (!reverse) {
      if (colIdx < userColumnIds.length - 1)
        return { rowId: current.rowId, columnId: userColumnIds[colIdx + 1] };
      if (rowIdx < rowIds.length - 1)
        return { rowId: rowIds[rowIdx + 1], columnId: userColumnIds[0] };
      return null;
    } else {
      if (colIdx > 0)
        return { rowId: current.rowId, columnId: userColumnIds[colIdx - 1] };
      if (rowIdx > 0)
        return {
          rowId: rowIds[rowIdx - 1],
          columnId: userColumnIds[userColumnIds.length - 1],
        };
      return null;
    }
  }

  function getCellType(columnId: string): CellType {
    const col = table.getColumn(columnId);
    return (col?.columnDef.meta as any)?.cellType ?? "readonly";
  }

  // ── commitEdit callback ─────────────────────────────────────────────────

  function commitEdit(
    action: "enter" | "tab" | "shift-tab" | "escape"
  ) {
    const cell = editingCell;
    setEditingCell(null);

    if (!cell) {
      tableRef.current?.focus();
      return;
    }

    if (action === "escape") {
      setSelectedCell({ ...cell });
      tableRef.current?.focus();
      return;
    }

    let next: EditingCell | null = null;
    if (action === "enter") next = getAdjacentCell(cell, "down");
    if (action === "tab") next = getTabCell(cell, false);
    if (action === "shift-tab") next = getTabCell(cell, true);

    setSelectedCell(next ?? cell);
    tableRef.current?.focus();
  }

  // ── Keyboard handler ────────────────────────────────────────────────────

  const handleTableKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTableElement>) => {
      // If editing, let cell's own handler deal with it
      if (editingCell) return;
      if (!selectedCell) return;

      const cellType = getCellType(selectedCell.columnId);

      switch (e.key) {
        case "ArrowUp":
        case "ArrowDown":
        case "ArrowLeft":
        case "ArrowRight": {
          e.preventDefault();
          const dir = e.key
            .replace("Arrow", "")
            .toLowerCase() as "up" | "down" | "left" | "right";
          const next = getAdjacentCell(selectedCell, dir);
          if (next) setSelectedCell(next);
          break;
        }

        case "Tab": {
          e.preventDefault();
          const next = getTabCell(selectedCell, e.shiftKey);
          if (next) setSelectedCell(next);
          break;
        }

        case "Enter": {
          e.preventDefault();
          if (cellType === "text" || cellType === "dropdown") {
            setEditingCell({ ...selectedCell });
          }
          break;
        }

        case "Escape": {
          e.preventDefault();
          setSelectedCell(null);
          break;
        }

        case "Backspace":
        case "Delete": {
          if (cellType === "text") {
            e.preventDefault();
            onUpdate(selectedCell.rowId, { [selectedCell.columnId]: "" });
          }
          break;
        }

        default: {
          // Alphanumeric type-to-edit on text cells
          if (
            cellType === "text" &&
            e.key.length === 1 &&
            !e.ctrlKey &&
            !e.metaKey &&
            !e.altKey
          ) {
            e.preventDefault();
            initialCharRef.current = e.key;
            setEditingCell({ ...selectedCell });
          }
          break;
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedCell, editingCell, userColumnIds, rowIds]
  );

  // ── Scroll selected cell into view ──────────────────────────────────────

  useEffect(() => {
    if (!selectedCell) return;
    const rowIndex = rows.findIndex((r) => r.id === selectedCell.rowId);
    if (rowIndex >= 0) {
      virtualizer.scrollToIndex(rowIndex, { align: "auto" });
      requestAnimationFrame(() => {
        const td = tableRef.current?.querySelector(
          `[data-row="${selectedCell.rowId}"][data-col="${selectedCell.columnId}"]`
        ) as HTMLElement | null;
        td?.scrollIntoView({ block: "nearest", inline: "nearest" });
      });
    }
  }, [selectedCell, rows, virtualizer]);

  // ── Clear selection if selected row is no longer visible ────────────────

  useEffect(() => {
    if (selectedCell && !rowIds.includes(selectedCell.rowId)) {
      setSelectedCell(null);
    }
  }, [rowIds, selectedCell]);

  // ── Standard handlers ───────────────────────────────────────────────────

  const selectedRows = table.getSelectedRowModel().rows;

  function handleDeleteSelected() {
    onDelete(selectedRows.map((r) => r.original.id));
    setRowSelection({});
  }

  function handleFilterChange(filterId: string, value: string) {
    if (value === "all") {
      setColumnFilters((prev) => prev.filter((f) => f.id !== filterId));
    } else {
      setColumnFilters((prev) => [
        ...prev.filter((f) => f.id !== filterId),
        { id: filterId, value },
      ]);
    }
  }

  const tableMinWidth = Object.values(columnWidths).reduce(
    (a, b) => a + (b ?? 0),
    0
  );

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 px-3 py-2 sm:px-4 sm:py-2.5">
        <div className="flex items-center gap-2">
          <h1 className="text-sm font-semibold text-zinc-900 sm:text-base">
            {entityName}
          </h1>
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500">
            {table.getFilteredRowModel().rows.length}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {toolbarExtra}

          {/* Global search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
            <Input
              placeholder="Search..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="h-8 w-32 pl-8 text-xs sm:w-44"
            />
          </div>

          {/* Filter dropdowns - hidden on mobile */}
          {filterOptions.map((filter) => {
            const activeValue =
              (columnFilters.find((f) => f.id === filter.id)
                ?.value as string) ?? "all";
            return (
              <Select
                key={filter.id}
                value={activeValue}
                onValueChange={(val) => handleFilterChange(filter.id, val)}
              >
                <SelectTrigger className="hidden h-8 w-36 text-xs sm:inline-flex">
                  <SelectValue placeholder={filter.label} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{filter.label}</SelectItem>
                  {filter.options.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            );
          })}

          {/* Delete selected */}
          {selectedRows.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteSelected}
              className="h-8 gap-1.5 text-xs"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Delete</span>{" "}
              {selectedRows.length}
            </Button>
          )}

          {/* Add entity */}
          {onAdd && (
            <Button
              size="sm"
              onClick={() => {
                const id = onAdd();
                const firstCol =
                  (userColumns[0]?.id as string) ??
                  ((userColumns[0] as any)?.accessorKey as string) ??
                  "";
                setTimeout(() => {
                  setSelectedCell({ rowId: id, columnId: firstCol });
                  setEditingCell({ rowId: id, columnId: firstCol });
                }, 30);
              }}
              className="h-8 gap-1.5 text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">
                {addLabel ?? `Add ${entityName.replace(/s$/, "")}`}
              </span>
            </Button>
          )}
        </div>
      </div>

      {/* Grid */}
      <div ref={scrollContainerRef} className="flex-1 overflow-auto">
        <table
          ref={tableRef}
          tabIndex={0}
          className="border-collapse text-sm outline-none"
          style={{ minWidth: tableMinWidth, width: "100%" }}
          onKeyDown={handleTableKeyDown}
          onBlur={(e) => {
            // If focus left the table entirely, clear selection
            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
              if (!editingCell) {
                setSelectedCell(null);
              }
            }
          }}
        >
          <thead className="sticky top-0 z-10">
            <tr className="border-b border-zinc-200 bg-zinc-50">
              {table.getFlatHeaders().map((header) => {
                const canSort = header.column.getCanSort();
                const sortDir = header.column.getIsSorted();
                const isColHighlighted =
                  selectedCell?.columnId === header.column.id;
                return (
                  <th
                    key={header.id}
                    className={cn(
                      "border-r border-zinc-200 px-2 py-2 text-left",
                      canSort &&
                        "cursor-pointer select-none hover:bg-zinc-100",
                      isColHighlighted && "bg-indigo-50"
                    )}
                    style={{ width: header.column.getSize() }}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div
                      className={cn(
                        "flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500",
                        isColHighlighted && "text-indigo-600"
                      )}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {canSort && (
                        <span className="ml-auto text-zinc-400">
                          {sortDir === "asc" ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : sortDir === "desc" ? (
                            <ChevronDown className="h-3 w-3" />
                          ) : (
                            <ChevronsUpDown className="h-3 w-3 opacity-40" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {/* Top spacer for virtualization */}
            {virtualRows.length > 0 && virtualRows[0].start > 0 && (
              <tr>
                <td
                  colSpan={allColumnCount}
                  style={{ height: virtualRows[0].start, padding: 0, border: "none" }}
                />
              </tr>
            )}

            {virtualRows.map((virtualRow) => {
              const row = rows[virtualRow.index];
              return (
                <tr
                  key={row.id}
                  className={cn(
                    "group border-b border-zinc-100 transition-colors",
                    row.getIsSelected() ? "bg-indigo-50" : "hover:bg-zinc-50/70",
                    onRowClick && "cursor-pointer"
                  )}
                  style={{ height: 36 }}
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => {
                    const isEditing =
                      editingCell?.rowId === row.id &&
                      editingCell?.columnId === cell.column.id;
                    const isSelected =
                      selectedCell?.rowId === row.id &&
                      selectedCell?.columnId === cell.column.id;
                    const isSystemCol = SYSTEM_COLS.has(cell.column.id);

                    return (
                      <td
                        key={cell.id}
                        data-row={row.id}
                        data-col={cell.column.id}
                        className={cn(
                          "h-9 overflow-hidden border-r border-zinc-100 p-0",
                          isEditing && "ring-2 ring-inset ring-indigo-500",
                          isSelected &&
                            !isEditing &&
                            "ring-2 ring-inset ring-indigo-400 bg-indigo-50/30",
                          isSystemCol && "text-center"
                        )}
                        style={{ width: cell.column.getSize() }}
                        onClick={(e) => {
                          if (isSystemCol) return;
                          e.stopPropagation(); // prevent row click
                          setSelectedCell({
                            rowId: row.id,
                            columnId: cell.column.id,
                          });
                          setEditingCell(null);
                          tableRef.current?.focus();
                        }}
                        onDoubleClick={(e) => {
                          if (isSystemCol) return;
                          e.stopPropagation();
                          const ct = getCellType(cell.column.id);
                          if (ct !== "readonly") {
                            setSelectedCell({
                              rowId: row.id,
                              columnId: cell.column.id,
                            });
                            setEditingCell({
                              rowId: row.id,
                              columnId: cell.column.id,
                            });
                          }
                        }}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}

            {/* Bottom spacer for virtualization */}
            {virtualRows.length > 0 && (
              <tr>
                <td
                  colSpan={allColumnCount}
                  style={{
                    height: totalHeight - virtualRows[virtualRows.length - 1].end,
                    padding: 0,
                    border: "none",
                  }}
                />
              </tr>
            )}
          </tbody>
        </table>

        {/* Add row */}
        {onAdd && (
          <button
            onClick={() => {
              const id = onAdd();
              const firstCol =
                (userColumns[0]?.id as string) ??
                ((userColumns[0] as any)?.accessorKey as string) ??
                "";
              setTimeout(() => {
                setSelectedCell({ rowId: id, columnId: firstCol });
                setEditingCell({ rowId: id, columnId: firstCol });
              }, 30);
            }}
            className="flex w-full items-center gap-2 border-b border-zinc-100 px-[88px] py-2 text-xs text-zinc-400 transition-colors hover:bg-zinc-50 hover:text-zinc-600"
            style={{ minWidth: tableMinWidth }}
          >
            <Plus className="h-3.5 w-3.5" />
            Add row
          </button>
        )}

        {/* Empty state */}
        {table.getFilteredRowModel().rows.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
            <EntityIcon className="mb-2 h-8 w-8 opacity-40" />
            <p className="text-sm font-medium">
              No {entityName.toLowerCase()} found
            </p>
            <p className="text-xs">Try adjusting your filters</p>
          </div>
        )}
      </div>
    </div>
  );
}

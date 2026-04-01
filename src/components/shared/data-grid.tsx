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
import FilterBuilder, {
  evaluateFilters,
  type FilterColumnDef,
  type FilterState,
} from "./filter-builder";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  ChevronRight,
  Search,
  MoreHorizontal,
  ChevronsUpDown,
  Layers,
  ArrowUpDown,
  X,
  type LucideIcon,
} from "lucide-react";

// ── Types ───────────────────────────────────────────────────────────────────
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
  /** Rendered beside the entity name/count on the LEFT of the toolbar */
  titleExtra?: React.ReactNode;
  /** Rendered on the RIGHT of the toolbar, before the search box */
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
  titleExtra,
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
  const [filterState, setFilterState] = useState<FilterState>({
    conditions: [],
    conjunction: "and",
  });
  const [groupBy, setGroupBy] = useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [showGroupPanel, setShowGroupPanel] = useState(false);
  const [showSortPanel, setShowSortPanel] = useState(false);
  const tableRef = useRef<HTMLTableElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const groupPanelRef = useRef<HTMLDivElement>(null);
  const sortPanelRef = useRef<HTMLDivElement>(null);
  const initialCharRef = useRef<string | null>(null);
  const prevRowCountRef = useRef<number>(0);

  // Click-outside handlers for sort/group panels
  useEffect(() => {
    if (!showGroupPanel) return;
    function handleOutside(e: MouseEvent) {
      if (groupPanelRef.current && !groupPanelRef.current.contains(e.target as Node)) {
        setShowGroupPanel(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [showGroupPanel]);

  useEffect(() => {
    if (!showSortPanel) return;
    function handleOutside(e: MouseEvent) {
      if (sortPanelRef.current && !sortPanelRef.current.contains(e.target as Node)) {
        setShowSortPanel(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [showSortPanel]);

  // Derive navigable column IDs from user columns
  const userColumnIds = useMemo(
    () =>
      userColumns
        .map((col) => (col as any).accessorKey ?? col.id)
        .filter(Boolean) as string[],
    [userColumns]
  );

  // Derive filter column definitions from user columns
  const filterColumns: FilterColumnDef[] = useMemo(
    () =>
      userColumns
        .map((col) => {
          const id =
            (col as any).accessorKey ?? col.id;
          const meta = col.meta as any;
          if (!id || !meta?.dataType) return null;
          return {
            id,
            label: typeof col.header === "string" ? col.header : id,
            dataType: meta.dataType,
            selectOptions: meta.selectOptions,
          } as FilterColumnDef;
        })
        .filter(Boolean) as FilterColumnDef[],
    [userColumns]
  );

  // Apply advanced filter conditions to data
  const filteredData = useMemo(() => {
    if (filterState.conditions.length === 0) return data;
    return data.filter((row) =>
      evaluateFilters(row as unknown as Record<string, unknown>, filterState, filterColumns)
    );
  }, [data, filterState, filterColumns]);

  // Sortable/groupable columns derived from user columns with accessorKey
  const sortableColumns = useMemo(
    () =>
      userColumns
        .filter((col) => (col as any).accessorKey && col.enableSorting !== false)
        .map((col) => ({
          id: (col as any).accessorKey as string,
          label: typeof col.header === "string" ? col.header : ((col as any).accessorKey as string),
        })),
    [userColumns]
  );

  const groupableColumns = useMemo(
    () =>
      userColumns
        .filter((col) => (col as any).accessorKey)
        .map((col) => ({
          id: (col as any).accessorKey as string,
          label: typeof col.header === "string" ? col.header : ((col as any).accessorKey as string),
        })),
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
    data: filteredData,
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

  // Groups computed from current filtered/sorted rows
  const groups = useMemo(() => {
    if (!groupBy) return null;
    const map = new Map<string, typeof rows>();
    for (const row of rows) {
      const key = String(row.getValue(groupBy) ?? "");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(row);
    }
    return Array.from(map.entries()).map(([value, groupRows]) => ({ value, rows: groupRows }));
  }, [groupBy, rows]);

  function getGroupDisplayValue(value: string): string {
    if (!groupBy) return value;
    const col = userColumns.find((c) => (c as any).accessorKey === groupBy);
    const meta = col?.meta as any;
    if (meta?.selectOptions) {
      return (meta.selectOptions.find((o: any) => o.value === value)?.label ?? value) || "—";
    }
    if (meta?.dataType === "date") {
      return value
        ? new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
        : "—";
    }
    return value || "—";
  }

  function toggleGroup(value: string) {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  }

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

  const tableMinWidth = Object.values(columnWidths).reduce(
    (a, b) => a + (b ?? 0),
    0
  );

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 px-3 py-2 sm:px-4 sm:py-2.5">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-semibold text-zinc-900 sm:text-base">
              {entityName}
            </h1>
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500">
              {table.getFilteredRowModel().rows.length}
            </span>
          </div>
          {titleExtra}
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

          {/* Advanced filter builder */}
          {filterColumns.length > 0 && (
            <FilterBuilder
              filterColumns={filterColumns}
              filterState={filterState}
              onFilterChange={setFilterState}
            />
          )}

          {/* Sort builder */}
          {sortableColumns.length > 0 && (
            <div className="relative" ref={sortPanelRef}>
              <button
                onClick={() => setShowSortPanel((v) => !v)}
                className={cn(
                  "flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition-colors",
                  sorting.length > 0
                    ? "border-indigo-300 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                    : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                )}
              >
                <ArrowUpDown className="h-3.5 w-3.5" />
                Sort
                {sorting.length > 0 && (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-600 px-1 text-[10px] font-semibold text-white">
                    {sorting.length}
                  </span>
                )}
              </button>

              {showSortPanel && (
                <div className="absolute right-0 top-full z-50 mt-1.5 w-72 rounded-lg border border-zinc-200 bg-white p-3 shadow-lg">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                    Sort by
                  </p>

                  {/* Active sort conditions */}
                  <div className="flex flex-col gap-1.5">
                    {sorting.map((s, idx) => (
                      <div key={s.id} className="flex items-center gap-1.5">
                        <span className="w-8 shrink-0 text-[10px] text-zinc-400">
                          {idx === 0 ? "by" : "then"}
                        </span>
                        {/* Column selector */}
                        <select
                          value={s.id}
                          onChange={(e) =>
                            setSorting((prev) =>
                              prev.map((item, i) =>
                                i === idx ? { ...item, id: e.target.value } : item
                              )
                            )
                          }
                          className="h-7 flex-1 rounded border border-zinc-200 bg-white px-1.5 text-xs text-zinc-700 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                        >
                          {sortableColumns.map((col) => (
                            <option key={col.id} value={col.id}>
                              {col.label}
                            </option>
                          ))}
                        </select>
                        {/* Direction toggle */}
                        <button
                          onClick={() =>
                            setSorting((prev) =>
                              prev.map((item, i) =>
                                i === idx ? { ...item, desc: !item.desc } : item
                              )
                            )
                          }
                          className="flex h-7 w-16 shrink-0 items-center justify-center rounded border border-zinc-200 bg-white text-xs text-zinc-600 hover:bg-zinc-50"
                        >
                          {s.desc ? "Z → A" : "A → Z"}
                        </button>
                        {/* Remove */}
                        <button
                          onClick={() =>
                            setSorting((prev) => prev.filter((_, i) => i !== idx))
                          }
                          className="text-zinc-400 hover:text-zinc-700"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add sort condition */}
                  {sorting.length < sortableColumns.length && (
                    <button
                      onClick={() => {
                        const usedIds = new Set(sorting.map((s) => s.id));
                        const next = sortableColumns.find((c) => !usedIds.has(c.id));
                        if (next) setSorting((prev) => [...prev, { id: next.id, desc: false }]);
                      }}
                      className="mt-2 flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add sort
                    </button>
                  )}

                  {/* Clear all */}
                  {sorting.length > 0 && (
                    <button
                      onClick={() => setSorting([])}
                      className="mt-1 flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-600"
                    >
                      <X className="h-3 w-3" />
                      Clear all
                    </button>
                  )}

                  {sorting.length === 0 && (
                    <p className="py-2 text-center text-xs text-zinc-400">
                      No sorts applied
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Group builder */}
          {groupableColumns.length > 0 && (
            <div className="relative" ref={groupPanelRef}>
              <button
                onClick={() => setShowGroupPanel((v) => !v)}
                className={cn(
                  "flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition-colors",
                  groupBy
                    ? "border-indigo-300 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                    : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                )}
              >
                <Layers className="h-3.5 w-3.5" />
                Group
                {groupBy && (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-600 px-1 text-[10px] font-semibold text-white">
                    1
                  </span>
                )}
              </button>

              {showGroupPanel && (
                <div className="absolute right-0 top-full z-50 mt-1.5 w-60 rounded-lg border border-zinc-200 bg-white p-3 shadow-lg">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                    Group by
                  </p>
                  {groupBy && (
                    <div className="mb-2 flex items-center gap-1.5 rounded-md bg-indigo-50 px-2 py-1.5">
                      <Layers className="h-3.5 w-3.5 text-indigo-500" />
                      <span className="flex-1 text-xs font-medium text-indigo-700">
                        {groupableColumns.find((c) => c.id === groupBy)?.label}
                      </span>
                      <button
                        onClick={() => {
                          setGroupBy(null);
                          setCollapsedGroups(new Set());
                        }}
                        className="text-indigo-400 hover:text-indigo-700"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                  <div className="flex flex-col gap-0.5">
                    {groupableColumns
                      .filter((c) => c.id !== groupBy)
                      .map((col) => (
                        <button
                          key={col.id}
                          onClick={() => {
                            setGroupBy(col.id);
                            setCollapsedGroups(new Set());
                            setShowGroupPanel(false);
                          }}
                          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-zinc-600 hover:bg-zinc-50"
                        >
                          <span className="h-3.5 w-3.5 rounded-sm border border-zinc-300" />
                          {col.label}
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

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
            {groups ? (
              // ── Grouped view (no virtualization) ──────────────────────────
              groups.map(({ value, rows: groupRows }) => {
                const isCollapsed = collapsedGroups.has(value);
                return (
                  <React.Fragment key={value}>
                    {/* Group header */}
                    <tr className="border-b border-zinc-200 bg-zinc-50/80">
                      <td colSpan={allColumnCount} className="px-3 py-1.5">
                        <button
                          className="flex items-center gap-1.5 text-xs font-semibold text-zinc-700 hover:text-zinc-900"
                          onClick={() => toggleGroup(value)}
                        >
                          <ChevronRight
                            className={cn(
                              "h-3.5 w-3.5 text-zinc-400 transition-transform duration-150",
                              !isCollapsed && "rotate-90"
                            )}
                          />
                          <span>{getGroupDisplayValue(value)}</span>
                          <span className="font-normal text-zinc-400">
                            ({groupRows.length})
                          </span>
                        </button>
                      </td>
                    </tr>
                    {/* Group rows */}
                    {!isCollapsed &&
                      groupRows.map((row) => (
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
                                  isSelected && !isEditing && "ring-2 ring-inset ring-indigo-400 bg-indigo-50/30",
                                  isSystemCol && "text-center"
                                )}
                                style={{ width: cell.column.getSize() }}
                                onClick={(e) => {
                                  if (isSystemCol) return;
                                  e.stopPropagation();
                                  setSelectedCell({ rowId: row.id, columnId: cell.column.id });
                                  setEditingCell(null);
                                  tableRef.current?.focus();
                                }}
                                onDoubleClick={(e) => {
                                  if (isSystemCol) return;
                                  e.stopPropagation();
                                  const ct = getCellType(cell.column.id);
                                  if (ct !== "readonly") {
                                    setSelectedCell({ rowId: row.id, columnId: cell.column.id });
                                    setEditingCell({ rowId: row.id, columnId: cell.column.id });
                                  }
                                }}
                              >
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                  </React.Fragment>
                );
              })
            ) : (
              // ── Flat virtualized view ──────────────────────────────────────
              <>
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
                              e.stopPropagation();
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
              </>
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

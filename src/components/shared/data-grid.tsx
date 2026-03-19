"use client";

import React, { useState } from "react";
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
import type { EditingCell } from "./grid-cells";
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
};

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
}: DataGridProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);

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
      cell: ({ row }) => (
        <span className="select-none text-xs text-zinc-400">
          {row.index + 1}
        </span>
      ),
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
    meta: { editingCell, setEditingCell, onUpdate },
  });

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
              <span className="hidden sm:inline">Delete</span> {selectedRows.length}
            </Button>
          )}

          {/* Add entity */}
          {onAdd && (
            <Button
              size="sm"
              onClick={() => {
                const id = onAdd();
                setTimeout(
                  () => setEditingCell({ rowId: id, columnId: userColumns[0]?.id as string ?? "" }),
                  30
                );
              }}
              className="h-8 gap-1.5 text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{addLabel ?? `Add ${entityName.replace(/s$/, "")}`}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto">
        <table
          className="border-collapse text-sm"
          style={{ minWidth: tableMinWidth, width: "100%" }}
        >
          <thead className="sticky top-0 z-10">
            <tr className="border-b border-zinc-200 bg-zinc-50">
              {table.getFlatHeaders().map((header) => {
                const canSort = header.column.getCanSort();
                const sortDir = header.column.getIsSorted();
                return (
                  <th
                    key={header.id}
                    className={cn(
                      "border-r border-zinc-200 px-2 py-2 text-left",
                      canSort &&
                        "cursor-pointer select-none hover:bg-zinc-100"
                    )}
                    style={{ width: header.column.getSize() }}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
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
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className={cn(
                  "group border-b border-zinc-100 transition-colors",
                  row.getIsSelected()
                    ? "bg-indigo-50"
                    : "hover:bg-zinc-50/70",
                  onRowClick && "cursor-pointer"
                )}
                style={{ height: 36 }}
                onClick={() => onRowClick?.(row.original)}
              >
                {row.getVisibleCells().map((cell) => {
                  const isEditing =
                    editingCell?.rowId === row.id &&
                    editingCell?.columnId === cell.column.id;
                  const isCenterAlign =
                    cell.column.id === "select" ||
                    cell.column.id === "rowNum" ||
                    cell.column.id === "actions";

                  return (
                    <td
                      key={cell.id}
                      className={cn(
                        "h-9 overflow-hidden border-r border-zinc-100 p-0",
                        isEditing && "ring-2 ring-inset ring-indigo-500",
                        isCenterAlign && "text-center"
                      )}
                      style={{ width: cell.column.getSize() }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Add row */}
        {onAdd && (
          <button
            onClick={() => {
              const id = onAdd();
              setTimeout(
                () =>
                  setEditingCell({
                    rowId: id,
                    columnId: userColumns[0]?.id as string ?? "",
                  }),
                30
              );
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
            <p className="text-sm font-medium">No {entityName.toLowerCase()} found</p>
            <p className="text-xs">Try adjusting your filters</p>
          </div>
        )}
      </div>
    </div>
  );
}

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
  type CellContext,
  type RowData,
} from "@tanstack/react-table";
import { useContactsStore } from "@/store/use-contacts-store";
import { STATUS_CONFIG, type Contact, type ContactStatus } from "@/lib/mock-data";
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
  Users,
} from "lucide-react";

// ── TableMeta augmentation ─────────────────────────────────────────────────
type EditingCell = { rowId: string; columnId: string };

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface TableMeta<TData extends RowData> {
    editingCell: EditingCell | null;
    setEditingCell: React.Dispatch<React.SetStateAction<EditingCell | null>>;
    updateContact: (id: string, updates: Partial<Contact>) => void;
  }
}

// ── Editable Text Cell ─────────────────────────────────────────────────────
function EditableCell({ getValue, row, column, table }: CellContext<Contact, string>) {
  const { editingCell, setEditingCell, updateContact } = table.options.meta!;
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
            updateContact(row.original.id, {
              [column.id]: e.target.value,
            } as Partial<Contact>);
          }
          setEditingCell(null);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") {
            setEditingCell(null);
          }
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
      onClick={() =>
        setEditingCell({ rowId: row.id, columnId: column.id })
      }
    >
      {value ? (
        <span className="truncate">{value}</span>
      ) : (
        <span className="text-zinc-300">—</span>
      )}
    </div>
  );
}

// ── Status Cell ────────────────────────────────────────────────────────────
function StatusCell({
  getValue,
  row,
  table,
}: CellContext<Contact, ContactStatus>) {
  const { updateContact } = table.options.meta!;
  const status = getValue();
  const config = STATUS_CONFIG[status];

  return (
    <Select
      value={status}
      onValueChange={(val) =>
        updateContact(row.original.id, { status: val as ContactStatus })
      }
    >
      <SelectTrigger className="h-full w-full rounded-none border-0 px-2 shadow-none focus:ring-0 text-sm">
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
            config.className
          )}
        >
          {config.label}
        </span>
      </SelectTrigger>
      <SelectContent>
        {(Object.keys(STATUS_CONFIG) as ContactStatus[]).map((s) => (
          <SelectItem key={s} value={s}>
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                STATUS_CONFIG[s].className
              )}
            >
              {STATUS_CONFIG[s].label}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// ── Date Cell ──────────────────────────────────────────────────────────────
function DateCell({ getValue }: CellContext<Contact, string>) {
  const value = getValue();
  return (
    <div className="flex h-full w-full items-center px-2 text-sm text-zinc-500">
      {value
        ? new Date(value).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
        : "—"}
    </div>
  );
}

// ── Column definitions ─────────────────────────────────────────────────────
const COLUMN_WIDTHS: Partial<Record<keyof Contact | "select" | "rowNum" | "actions", number>> = {
  select: 40,
  rowNum: 40,
  name: 160,
  email: 200,
  phone: 140,
  company: 160,
  status: 120,
  notes: 220,
  createdAt: 110,
  actions: 44,
};

// ── Main Component ─────────────────────────────────────────────────────────
export default function ContactsGrid() {
  const { contacts, addContact, updateContact, deleteContacts } =
    useContactsStore();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);

  const columns: ColumnDef<Contact, any>[] = [
    // Checkbox
    {
      id: "select",
      size: COLUMN_WIDTHS.select,
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
    // Row number
    {
      id: "rowNum",
      size: COLUMN_WIDTHS.rowNum,
      enableSorting: false,
      enableColumnFilter: false,
      header: () => null,
      cell: ({ row }) => (
        <span className="select-none text-xs text-zinc-400">
          {row.index + 1}
        </span>
      ),
    },
    // Name
    {
      accessorKey: "name",
      header: "Name",
      size: COLUMN_WIDTHS.name,
      cell: EditableCell,
      filterFn: "includesString",
    },
    // Email
    {
      accessorKey: "email",
      header: "Email",
      size: COLUMN_WIDTHS.email,
      cell: EditableCell,
      filterFn: "includesString",
    },
    // Phone
    {
      accessorKey: "phone",
      header: "Phone",
      size: COLUMN_WIDTHS.phone,
      cell: EditableCell,
      enableColumnFilter: false,
    },
    // Company
    {
      accessorKey: "company",
      header: "Company",
      size: COLUMN_WIDTHS.company,
      cell: EditableCell,
      filterFn: "includesString",
    },
    // Status
    {
      accessorKey: "status",
      header: "Status",
      size: COLUMN_WIDTHS.status,
      cell: StatusCell,
      filterFn: "equals",
    },
    // Notes
    {
      accessorKey: "notes",
      header: "Notes",
      size: COLUMN_WIDTHS.notes,
      cell: EditableCell,
      enableColumnFilter: false,
    },
    // Created
    {
      accessorKey: "createdAt",
      header: "Created",
      size: COLUMN_WIDTHS.createdAt,
      cell: DateCell,
      enableColumnFilter: false,
    },
    // Row actions
    {
      id: "actions",
      size: COLUMN_WIDTHS.actions,
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
              onClick={() => deleteContacts([row.original.id])}
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
    data: contacts,
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
    meta: { editingCell, setEditingCell, updateContact },
  });

  const selectedRows = table.getSelectedRowModel().rows;
  const activeStatusFilter =
    (columnFilters.find((f) => f.id === "status")?.value as string) ?? "all";

  function handleAddRow() {
    const id = addContact({
      name: "",
      email: "",
      phone: "",
      company: "",
      status: "lead",
      notes: "",
    });
    setTimeout(() => setEditingCell({ rowId: id, columnId: "name" }), 30);
  }

  function handleDeleteSelected() {
    deleteContacts(selectedRows.map((r) => r.original.id));
    setRowSelection({});
  }

  function handleStatusFilter(value: string) {
    if (value === "all") {
      setColumnFilters((prev) => prev.filter((f) => f.id !== "status"));
    } else {
      setColumnFilters((prev) => [
        ...prev.filter((f) => f.id !== "status"),
        { id: "status", value },
      ]);
    }
  }

  const tableMinWidth = Object.values(COLUMN_WIDTHS).reduce(
    (a, b) => a + (b ?? 0),
    0
  );

  return (
    <div className="flex h-full flex-col bg-white">
      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <h1 className="text-base font-semibold text-zinc-900">Contacts</h1>
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500">
            {table.getFilteredRowModel().rows.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Global search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
            <Input
              placeholder="Search..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="h-8 w-44 pl-8 text-xs"
            />
          </div>

          {/* Status filter */}
          <Select value={activeStatusFilter} onValueChange={handleStatusFilter}>
            <SelectTrigger className="h-8 w-36 text-xs">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {(Object.keys(STATUS_CONFIG) as ContactStatus[]).map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_CONFIG[s].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Delete selected */}
          {selectedRows.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteSelected}
              className="h-8 gap-1.5 text-xs"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete {selectedRows.length}
            </Button>
          )}

          {/* Add contact */}
          <Button size="sm" onClick={handleAddRow} className="h-8 gap-1.5 text-xs">
            <Plus className="h-3.5 w-3.5" />
            Add Contact
          </Button>
        </div>
      </div>

      {/* ── Grid ── */}
      <div className="flex-1 overflow-auto">
        <table
          className="border-collapse text-sm"
          style={{ minWidth: tableMinWidth, width: "100%" }}
        >
          {/* Header */}
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

          {/* Body */}
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className={cn(
                  "group border-b border-zinc-100 transition-colors",
                  row.getIsSelected()
                    ? "bg-indigo-50"
                    : "hover:bg-zinc-50/70"
                )}
                style={{ height: 36 }}
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

        {/* Add row button */}
        <button
          onClick={handleAddRow}
          className="flex w-full items-center gap-2 border-b border-zinc-100 px-[88px] py-2 text-xs text-zinc-400 transition-colors hover:bg-zinc-50 hover:text-zinc-600"
          style={{ minWidth: tableMinWidth }}
        >
          <Plus className="h-3.5 w-3.5" />
          Add row
        </button>

        {/* Empty state */}
        {table.getFilteredRowModel().rows.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
            <Users className="mb-2 h-8 w-8 opacity-40" />
            <p className="text-sm font-medium">No contacts found</p>
            <p className="text-xs">Try adjusting your filters</p>
          </div>
        )}
      </div>
    </div>
  );
}


"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
  type RowSelectionState,
  type CellContext,
  type RowData,
  type Row,
} from "@tanstack/react-table";
import { useContactsStore } from "@/store/use-contacts-store";
import {
  STATUS_CONFIG,
  type Contact,
  type ContactStatus,
} from "@/lib/mock-data";
import {
  type FilterCondition,
  type SortRule,
  type FieldDef,
  OPERATORS_FOR_TYPE,
  defaultOperatorForType,
  getSortLabels,
  applyFilter,
  applySort,
} from "@/lib/view-filters";
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
  Search,
  MoreHorizontal,
  Users,
  Filter,
  ArrowUpDown,
  Layers,
  X,
  ChevronDown,
  ChevronRight,
  Check,
} from "lucide-react";

// ── TableMeta augmentation ──────────────────────────────────────────────────
type EditingCell = { rowId: string; columnId: string };

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface TableMeta<TData extends RowData> {
    editingCell: EditingCell | null;
    setEditingCell: React.Dispatch<React.SetStateAction<EditingCell | null>>;
    updateContact: (id: string, updates: Partial<Contact>) => void;
  }
}

// ── Field definitions ───────────────────────────────────────────────────────
const CONTACT_FILTER_FIELDS: FieldDef[] = [
  { key: "name", label: "Name", type: "string" },
  { key: "email", label: "Email", type: "string" },
  { key: "company", label: "Company", type: "string" },
  { key: "phone", label: "Phone", type: "string" },
  {
    key: "status",
    label: "Status",
    type: "enum",
    options: (
      Object.entries(STATUS_CONFIG) as [
        ContactStatus,
        { label: string; className: string },
      ][]
    ).map(([k, v]) => ({ value: k, label: v.label })),
  },
  { key: "createdAt", label: "Created", type: "date" },
];

const CONTACT_SORT_FIELDS: FieldDef[] = [
  { key: "name", label: "Name", type: "string" },
  { key: "email", label: "Email", type: "string" },
  { key: "company", label: "Company", type: "string" },
  { key: "status", label: "Status", type: "string" },
  { key: "createdAt", label: "Created", type: "date" },
];

const GROUP_OPTIONS: { key: string | null; label: string }[] = [
  { key: null, label: "No grouping" },
  { key: "status", label: "Status" },
  { key: "company", label: "Company" },
];

// ── Editable Text Cell ──────────────────────────────────────────────────────
function EditableCell({
  getValue,
  row,
  column,
  table,
}: CellContext<Contact, string>) {
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
        <span className="text-zinc-300">—</span>
      )}
    </div>
  );
}

// ── Status Cell ─────────────────────────────────────────────────────────────
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

// ── Date Cell ───────────────────────────────────────────────────────────────
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

// ── Filter Panel ────────────────────────────────────────────────────────────
function FilterPanel({
  fields,
  conditions,
  onChange,
}: {
  fields: FieldDef[];
  conditions: FilterCondition[];
  onChange: (conditions: FilterCondition[]) => void;
}) {
  function addCondition() {
    const field = fields[0];
    onChange([
      ...conditions,
      {
        id: `f${Date.now()}`,
        field: field.key,
        operator: defaultOperatorForType(field.type),
        value: "",
      },
    ]);
  }

  function removeCondition(id: string) {
    onChange(conditions.filter((c) => c.id !== id));
  }

  function updateCondition(id: string, updates: Partial<FilterCondition>) {
    onChange(conditions.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  }

  return (
    <div className="w-[540px] rounded-lg border border-zinc-200 bg-white shadow-xl">
      <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
        <span className="text-sm font-semibold text-zinc-800">Filter</span>
        <button
          onClick={addCondition}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Add filter
        </button>
      </div>
      {conditions.length === 0 ? (
        <div className="px-4 py-6 text-center text-xs text-zinc-400">
          No filter conditions.{" "}
          <span className="font-medium text-zinc-600">+ Add filter</span> to
          start.
        </div>
      ) : (
        <div className="divide-y divide-zinc-50 max-h-72 overflow-y-auto">
          {conditions.map((condition, index) => {
            const fieldDef =
              fields.find((f) => f.key === condition.field) ?? fields[0];
            const operators = OPERATORS_FOR_TYPE[fieldDef.type];
            const needsValue = !["is_empty", "is_not_empty"].includes(
              condition.operator
            );

            return (
              <div
                key={condition.id}
                className="flex items-center gap-2 px-4 py-2"
              >
                <span className="w-10 shrink-0 text-right text-xs text-zinc-400">
                  {index === 0 ? "Where" : "And"}
                </span>

                <Select
                  value={condition.field}
                  onValueChange={(field) => {
                    const def =
                      fields.find((f) => f.key === field) ?? fields[0];
                    updateCondition(condition.id, {
                      field,
                      operator: defaultOperatorForType(def.type),
                      value: "",
                    });
                  }}
                >
                  <SelectTrigger className="h-7 w-28 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fields.map((f) => (
                      <SelectItem key={f.key} value={f.key}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={condition.operator}
                  onValueChange={(op) =>
                    updateCondition(condition.id, {
                      operator: op as FilterCondition["operator"],
                      value: "",
                    })
                  }
                >
                  <SelectTrigger className="h-7 w-36 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {operators.map((op) => (
                      <SelectItem key={op.value} value={op.value}>
                        {op.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {needsValue &&
                  (fieldDef.type === "enum" ? (
                    <Select
                      value={condition.value}
                      onValueChange={(val) =>
                        updateCondition(condition.id, { value: val })
                      }
                    >
                      <SelectTrigger className="h-7 flex-1 text-xs">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {fieldDef.options?.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      className="h-7 flex-1 text-xs"
                      type={
                        fieldDef.type === "number"
                          ? "number"
                          : fieldDef.type === "date"
                            ? "date"
                            : "text"
                      }
                      value={condition.value}
                      onChange={(e) =>
                        updateCondition(condition.id, {
                          value: e.target.value,
                        })
                      }
                      placeholder="Enter value..."
                    />
                  ))}

                <button
                  onClick={() => removeCondition(condition.id)}
                  className="shrink-0 text-zinc-300 hover:text-zinc-500 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Sort Panel ──────────────────────────────────────────────────────────────
function SortPanel({
  fields,
  rules,
  onChange,
}: {
  fields: FieldDef[];
  rules: SortRule[];
  onChange: (rules: SortRule[]) => void;
}) {
  function addRule() {
    const usedFields = new Set(rules.map((r) => r.field));
    const field =
      fields.find((f) => !usedFields.has(f.key)) ?? fields[0];
    onChange([
      ...rules,
      { id: `s${Date.now()}`, field: field.key, direction: "asc" },
    ]);
  }

  function removeRule(id: string) {
    onChange(rules.filter((r) => r.id !== id));
  }

  function updateRule(id: string, updates: Partial<SortRule>) {
    onChange(rules.map((r) => (r.id === id ? { ...r, ...updates } : r)));
  }

  return (
    <div className="w-[380px] rounded-lg border border-zinc-200 bg-white shadow-xl">
      <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
        <span className="text-sm font-semibold text-zinc-800">Sort</span>
        {rules.length < fields.length && (
          <button
            onClick={addRule}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Add sort
          </button>
        )}
      </div>
      {rules.length === 0 ? (
        <div className="px-4 py-6 text-center text-xs text-zinc-400">
          No sort rules.{" "}
          <span className="font-medium text-zinc-600">+ Add sort</span> to
          start.
        </div>
      ) : (
        <div className="divide-y divide-zinc-50">
          {rules.map((rule, index) => {
            const fieldDef =
              fields.find((f) => f.key === rule.field) ?? fields[0];
            const labels = getSortLabels(fieldDef.type);
            return (
              <div
                key={rule.id}
                className="flex items-center gap-2 px-4 py-2"
              >
                <span className="w-8 shrink-0 text-right text-xs text-zinc-400">
                  {index === 0 ? "By" : "Then"}
                </span>
                <Select
                  value={rule.field}
                  onValueChange={(field) => updateRule(rule.id, { field })}
                >
                  <SelectTrigger className="h-7 flex-1 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fields.map((f) => (
                      <SelectItem key={f.key} value={f.key}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={rule.direction}
                  onValueChange={(dir) =>
                    updateRule(rule.id, {
                      direction: dir as "asc" | "desc",
                    })
                  }
                >
                  <SelectTrigger className="h-7 w-32 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">{labels.asc}</SelectItem>
                    <SelectItem value="desc">{labels.desc}</SelectItem>
                  </SelectContent>
                </Select>
                <button
                  onClick={() => removeRule(rule.id)}
                  className="shrink-0 text-zinc-300 hover:text-zinc-500 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Group Panel ─────────────────────────────────────────────────────────────
function GroupPanel({
  groupBy,
  onChange,
}: {
  groupBy: string | null;
  onChange: (field: string | null) => void;
}) {
  return (
    <div className="w-[200px] rounded-lg border border-zinc-200 bg-white shadow-xl">
      <div className="border-b border-zinc-100 px-4 py-3">
        <span className="text-sm font-semibold text-zinc-800">Group by</span>
      </div>
      <div className="py-1">
        {GROUP_OPTIONS.map((opt) => (
          <button
            key={String(opt.key)}
            className={cn(
              "flex w-full items-center gap-2 px-4 py-2 text-left text-sm transition-colors hover:bg-zinc-50",
              groupBy === opt.key ? "text-indigo-600" : "text-zinc-700"
            )}
            onClick={() => onChange(opt.key)}
          >
            <span className="flex w-4 items-center justify-center">
              {groupBy === opt.key && <Check className="h-3.5 w-3.5" />}
            </span>
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Column widths ───────────────────────────────────────────────────────────
const COLUMN_WIDTHS: Partial<
  Record<keyof Contact | "select" | "rowNum" | "actions", number>
> = {
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

// ── Main Component ──────────────────────────────────────────────────────────
export default function ContactsGrid() {
  const { contacts, addContact, updateContact, deleteContacts } =
    useContactsStore();

  // View state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterConditions, setFilterConditions] = useState<FilterCondition[]>(
    []
  );
  const [sortRules, setSortRules] = useState<SortRule[]>([]);
  const [groupBy, setGroupBy] = useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
    new Set()
  );
  const [activePanel, setActivePanel] = useState<
    "filter" | "sort" | "group" | null
  >(null);

  // Table state
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);

  // Click-outside to close panels
  const toolbarRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!activePanel) return;
    function handleClick(e: MouseEvent) {
      if (
        toolbarRef.current &&
        !toolbarRef.current.contains(e.target as Node)
      ) {
        setActivePanel(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [activePanel]);

  // Processed contacts: search → filter → sort
  const processedContacts = useMemo(() => {
    let result = [...contacts];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.company.toLowerCase().includes(q)
      );
    }

    if (filterConditions.length > 0) {
      result = result.filter((c) =>
        filterConditions.every((fc) =>
          applyFilter(c as unknown as Record<string, unknown>, fc, CONTACT_FILTER_FIELDS)
        )
      );
    }

    if (sortRules.length > 0) {
      result = applySort(
        result as unknown as Record<string, unknown>[],
        sortRules
      ) as unknown as Contact[];
    }

    return result;
  }, [contacts, searchQuery, filterConditions, sortRules]);

  // Display rows: flat or grouped
  type DisplayRow =
    | { type: "group"; key: string; label: string; count: number; collapsed: boolean }
    | { type: "data"; contact: Contact };

  const displayRows = useMemo((): DisplayRow[] => {
    if (!groupBy) {
      return processedContacts.map((c) => ({ type: "data", contact: c }));
    }
    const grouped = new Map<string, Contact[]>();
    processedContacts.forEach((c) => {
      const raw = c[groupBy as keyof Contact] as string;
      const label =
        groupBy === "status"
          ? (STATUS_CONFIG[raw as ContactStatus]?.label ?? raw)
          : raw || "(empty)";
      if (!grouped.has(label)) grouped.set(label, []);
      grouped.get(label)!.push(c);
    });

    const rows: DisplayRow[] = [];
    grouped.forEach((groupContacts, label) => {
      const collapsed = collapsedGroups.has(label);
      rows.push({
        type: "group",
        key: label,
        label,
        count: groupContacts.length,
        collapsed,
      });
      if (!collapsed) {
        groupContacts.forEach((c) => rows.push({ type: "data", contact: c }));
      }
    });
    return rows;
  }, [processedContacts, groupBy, collapsedGroups]);

  function toggleGroup(label: string) {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }

  // Column definitions
  const columns: ColumnDef<Contact, string>[] = [
    {
      id: "select",
      size: COLUMN_WIDTHS.select,
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
      size: COLUMN_WIDTHS.rowNum,
      header: () => null,
      cell: ({ row }) => (
        <span className="select-none text-xs text-zinc-400">
          {row.index + 1}
        </span>
      ),
    },
    {
      accessorKey: "name",
      header: "Name",
      size: COLUMN_WIDTHS.name,
      cell: EditableCell,
    },
    {
      accessorKey: "email",
      header: "Email",
      size: COLUMN_WIDTHS.email,
      cell: EditableCell,
    },
    {
      accessorKey: "phone",
      header: "Phone",
      size: COLUMN_WIDTHS.phone,
      cell: EditableCell,
    },
    {
      accessorKey: "company",
      header: "Company",
      size: COLUMN_WIDTHS.company,
      cell: EditableCell,
    },
    {
      accessorKey: "status",
      header: "Status",
      size: COLUMN_WIDTHS.status,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cell: StatusCell as any,
    },
    {
      accessorKey: "notes",
      header: "Notes",
      size: COLUMN_WIDTHS.notes,
      cell: EditableCell,
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      size: COLUMN_WIDTHS.createdAt,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cell: DateCell as any,
    },
    {
      id: "actions",
      size: COLUMN_WIDTHS.actions,
      header: () => null,
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
    data: processedContacts,
    columns,
    getRowId: (row) => row.id,
    state: { rowSelection },
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    enableRowSelection: true,
    meta: { editingCell, setEditingCell, updateContact },
  });

  // Build rowsById for grouped rendering
  const rowsById = new Map<string, Row<Contact>>();
  table.getRowModel().rows.forEach((r) => rowsById.set(r.id, r));

  const selectedRows = table.getSelectedRowModel().rows;

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

  function togglePanel(panel: "filter" | "sort" | "group") {
    setActivePanel((prev) => (prev === panel ? null : panel));
  }

  const tableMinWidth = Object.values(COLUMN_WIDTHS).reduce(
    (a, b) => a + (b ?? 0),
    0
  );
  const totalColumns = columns.length;

  return (
    <div className="flex h-full flex-col bg-white">
      {/* ── Toolbar ── */}
      <div ref={toolbarRef} className="relative border-b border-zinc-200">
        <div className="flex items-center gap-2 px-4 py-2.5">
          {/* Title */}
          <h1 className="text-base font-semibold text-zinc-900">Contacts</h1>
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500">
            {processedContacts.length}
          </span>

          <div className="mx-1 h-5 w-px bg-zinc-200" />

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 w-44 pl-8 text-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Filter */}
          <button
            onClick={() => togglePanel("filter")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
              activePanel === "filter"
                ? "bg-indigo-50 text-indigo-700"
                : "text-zinc-600 hover:bg-zinc-100"
            )}
          >
            <Filter className="h-3.5 w-3.5" />
            Filter
            {filterConditions.length > 0 && (
              <span className="rounded-full bg-indigo-100 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700">
                {filterConditions.length}
              </span>
            )}
          </button>

          {/* Sort */}
          <button
            onClick={() => togglePanel("sort")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
              activePanel === "sort"
                ? "bg-indigo-50 text-indigo-700"
                : "text-zinc-600 hover:bg-zinc-100"
            )}
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
            Sort
            {sortRules.length > 0 && (
              <span className="rounded-full bg-indigo-100 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700">
                {sortRules.length}
              </span>
            )}
          </button>

          {/* Group */}
          <button
            onClick={() => togglePanel("group")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
              activePanel === "group" || groupBy !== null
                ? "bg-indigo-50 text-indigo-700"
                : "text-zinc-600 hover:bg-zinc-100"
            )}
          >
            <Layers className="h-3.5 w-3.5" />
            Group
            {groupBy !== null && (
              <span className="rounded-full bg-indigo-100 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700">
                1
              </span>
            )}
          </button>

          <div className="flex-1" />

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

          <Button
            size="sm"
            onClick={handleAddRow}
            className="h-8 gap-1.5 text-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Contact
          </Button>
        </div>

        {/* ── Panels ── */}
        {activePanel === "filter" && (
          <div className="absolute left-4 top-full z-50 mt-1.5">
            <FilterPanel
              fields={CONTACT_FILTER_FIELDS}
              conditions={filterConditions}
              onChange={setFilterConditions}
            />
          </div>
        )}
        {activePanel === "sort" && (
          <div className="absolute left-4 top-full z-50 mt-1.5">
            <SortPanel
              fields={CONTACT_SORT_FIELDS}
              rules={sortRules}
              onChange={setSortRules}
            />
          </div>
        )}
        {activePanel === "group" && (
          <div className="absolute left-4 top-full z-50 mt-1.5">
            <GroupPanel
              groupBy={groupBy}
              onChange={(f) => {
                setGroupBy(f);
                setCollapsedGroups(new Set());
                setActivePanel(null);
              }}
            />
          </div>
        )}
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
              {table.getFlatHeaders().map((header) => (
                <th
                  key={header.id}
                  className="border-r border-zinc-200 px-2 py-2 text-left"
                  style={{ width: header.column.getSize() }}
                >
                  <div className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {displayRows.map((row) => {
              if (row.type === "group") {
                return (
                  <tr
                    key={`g-${row.key}`}
                    className="border-b border-zinc-200 bg-zinc-50/80"
                  >
                    <td colSpan={totalColumns} className="px-3 py-1.5">
                      <button
                        onClick={() => toggleGroup(row.label)}
                        className="flex items-center gap-2 text-xs font-semibold text-zinc-600 hover:text-zinc-900"
                      >
                        {row.collapsed ? (
                          <ChevronRight className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5" />
                        )}
                        {row.label}
                        <span className="font-normal text-zinc-400">
                          ({row.count})
                        </span>
                      </button>
                    </td>
                  </tr>
                );
              }

              const tableRow = rowsById.get(row.contact.id);
              if (!tableRow) return null;

              return (
                <tr
                  key={tableRow.id}
                  className={cn(
                    "group border-b border-zinc-100 transition-colors",
                    tableRow.getIsSelected()
                      ? "bg-indigo-50"
                      : "hover:bg-zinc-50/70"
                  )}
                  style={{ height: 36 }}
                >
                  {tableRow.getVisibleCells().map((cell) => {
                    const isEditing =
                      editingCell?.rowId === tableRow.id &&
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
              );
            })}
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
        {processedContacts.length === 0 && (
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

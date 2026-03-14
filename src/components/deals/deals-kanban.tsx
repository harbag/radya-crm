"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { DragDropContext, type DropResult } from "@hello-pangea/dnd";
import { useDealsStore } from "@/store/use-deals-store";
import {
  DEAL_STAGES,
  formatCurrency,
  getContactById,
  type DealStage,
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  Search,
  Filter,
  ArrowUpDown,
  Layers,
  Plus,
  X,
  Check,
} from "lucide-react";
import KanbanColumn from "./kanban-column";

// ── Field definitions ───────────────────────────────────────────────────────
const DEAL_FILTER_FIELDS: FieldDef[] = [
  { key: "title", label: "Title", type: "string" },
  { key: "value", label: "Value (IDR)", type: "number" },
  { key: "notes", label: "Notes", type: "string" },
  { key: "expectedCloseDate", label: "Close Date", type: "date" },
];

const DEAL_SORT_FIELDS: FieldDef[] = [
  { key: "value", label: "Value", type: "number" },
  { key: "title", label: "Title", type: "string" },
  { key: "expectedCloseDate", label: "Close Date", type: "date" },
];

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
    <div className="w-[500px] rounded-lg border border-zinc-200 bg-white shadow-xl">
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

                {needsValue && (
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
                      updateCondition(condition.id, { value: e.target.value })
                    }
                    placeholder="Enter value..."
                  />
                )}

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
    const field = fields.find((f) => !usedFields.has(f.key)) ?? fields[0];
    onChange([
      ...rules,
      { id: `s${Date.now()}`, field: field.key, direction: "desc" },
    ]);
  }

  function removeRule(id: string) {
    onChange(rules.filter((r) => r.id !== id));
  }

  function updateRule(id: string, updates: Partial<SortRule>) {
    onChange(rules.map((r) => (r.id === id ? { ...r, ...updates } : r)));
  }

  return (
    <div className="w-[360px] rounded-lg border border-zinc-200 bg-white shadow-xl">
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
                    updateRule(rule.id, { direction: dir as "asc" | "desc" })
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
      {rules.length > 0 && (
        <p className="border-t border-zinc-50 px-4 py-2 text-[10px] text-zinc-400">
          Sort overrides drag-and-drop order within columns.
        </p>
      )}
    </div>
  );
}

// ── Group Panel (stage visibility) ──────────────────────────────────────────
function GroupPanel({
  visibleStages,
  onChange,
}: {
  visibleStages: Set<DealStage>;
  onChange: (stages: Set<DealStage>) => void;
}) {
  function toggle(id: DealStage) {
    const next = new Set(visibleStages);
    if (next.has(id)) {
      if (next.size > 1) next.delete(id); // keep at least one visible
    } else {
      next.add(id);
    }
    onChange(next);
  }

  return (
    <div className="w-[220px] rounded-lg border border-zinc-200 bg-white shadow-xl">
      <div className="border-b border-zinc-100 px-4 py-3">
        <span className="text-sm font-semibold text-zinc-800">
          Visible columns
        </span>
      </div>
      <div className="py-1">
        {DEAL_STAGES.map((stage) => {
          const visible = visibleStages.has(stage.id);
          return (
            <button
              key={stage.id}
              className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm transition-colors hover:bg-zinc-50"
              onClick={() => toggle(stage.id)}
            >
              <span
                className={cn(
                  "flex h-4 w-4 items-center justify-center rounded border transition-colors",
                  visible
                    ? "border-indigo-500 bg-indigo-500"
                    : "border-zinc-300 bg-white"
                )}
              >
                {visible && <Check className="h-3 w-3 text-white" />}
              </span>
              <span className={visible ? "text-zinc-800" : "text-zinc-400"}>
                {stage.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────
export default function DealsKanban() {
  const { deals, moveDeal } = useDealsStore();

  // View state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterConditions, setFilterConditions] = useState<FilterCondition[]>(
    []
  );
  const [sortRules, setSortRules] = useState<SortRule[]>([]);
  const [visibleStages, setVisibleStages] = useState<Set<DealStage>>(
    () => new Set(DEAL_STAGES.map((s) => s.id))
  );
  const [activePanel, setActivePanel] = useState<
    "filter" | "sort" | "group" | null
  >(null);

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

  // Deals after filter + sort (search handled separately as dimming)
  const processedDeals = useMemo(() => {
    let result = [...deals];

    if (filterConditions.length > 0) {
      result = result.filter((d) =>
        filterConditions.every((fc) =>
          applyFilter(
            d as unknown as Record<string, unknown>,
            fc,
            DEAL_FILTER_FIELDS
          )
        )
      );
    }

    if (sortRules.length > 0) {
      // Sort per stage to maintain column ordering
      const byStage = new Map<DealStage, typeof result>();
      result.forEach((d) => {
        if (!byStage.has(d.stage)) byStage.set(d.stage, []);
        byStage.get(d.stage)!.push(d);
      });
      byStage.forEach((stageDeals, stage) => {
        byStage.set(
          stage,
          applySort(
            stageDeals as unknown as Record<string, unknown>[],
            sortRules
          ) as unknown as typeof result
        );
      });
      result = Array.from(byStage.values()).flat();
    }

    return result;
  }, [deals, filterConditions, sortRules]);

  // Search: dim non-matching cards (don't hide them)
  const matchedIds = useMemo((): Set<string> | null => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    return new Set(
      deals
        .filter((d) => {
          const contact = getContactById(d.contactId);
          return (
            d.title.toLowerCase().includes(q) ||
            contact?.name.toLowerCase().includes(q)
          );
        })
        .map((d) => d.id)
    );
  }, [deals, searchQuery]);

  function handleDragEnd(result: DropResult) {
    if (!result.destination) return;
    const { draggableId, source, destination } = result;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    )
      return;
    moveDeal(
      draggableId,
      destination.droppableId as DealStage,
      destination.index
    );
  }

  const totalPipeline = deals
    .filter((d) => d.stage !== "closed_lost")
    .reduce((s, d) => s + d.value, 0);

  const closedWon = deals
    .filter((d) => d.stage === "closed_won")
    .reduce((s, d) => s + d.value, 0);

  const activeDeals = deals.filter(
    (d) => d.stage !== "closed_won" && d.stage !== "closed_lost"
  ).length;

  const hiddenStagesCount =
    DEAL_STAGES.length - visibleStages.size;

  function togglePanel(panel: "filter" | "sort" | "group") {
    setActivePanel((prev) => (prev === panel ? null : panel));
  }

  return (
    <div className="flex h-full flex-col bg-white">
      {/* ── Header + Toolbar ── */}
      <div ref={toolbarRef} className="relative border-b border-zinc-200">
        <div className="flex items-center gap-2 px-6 py-2.5">
          {/* Title */}
          <h1 className="text-base font-semibold text-zinc-900">
            Deals Pipeline
          </h1>
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500">
            {processedDeals.length}
          </span>

          <div className="mx-1 h-5 w-px bg-zinc-200" />

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
            <Input
              placeholder="Search deals..."
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

          {/* Group (visible columns) */}
          <button
            onClick={() => togglePanel("group")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
              activePanel === "group" || hiddenStagesCount > 0
                ? "bg-indigo-50 text-indigo-700"
                : "text-zinc-600 hover:bg-zinc-100"
            )}
          >
            <Layers className="h-3.5 w-3.5" />
            Group
            {hiddenStagesCount > 0 && (
              <span className="rounded-full bg-indigo-100 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700">
                {hiddenStagesCount} hidden
              </span>
            )}
          </button>

          <div className="flex-1" />

          {/* Metrics */}
          <div className="flex items-center gap-5 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-400">Pipeline</span>
              <span className="font-semibold text-zinc-800">
                {formatCurrency(totalPipeline)}
              </span>
            </div>
            <div className="h-3.5 w-px bg-zinc-200" />
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-400">Won</span>
              <span className="font-semibold text-emerald-600">
                {formatCurrency(closedWon)}
              </span>
            </div>
            <div className="h-3.5 w-px bg-zinc-200" />
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-400">Active</span>
              <span className="font-semibold text-zinc-800">{activeDeals}</span>
            </div>
          </div>
        </div>

        {/* ── Panels ── */}
        {activePanel === "filter" && (
          <div className="absolute left-6 top-full z-50 mt-1.5">
            <FilterPanel
              fields={DEAL_FILTER_FIELDS}
              conditions={filterConditions}
              onChange={setFilterConditions}
            />
          </div>
        )}
        {activePanel === "sort" && (
          <div className="absolute left-6 top-full z-50 mt-1.5">
            <SortPanel
              fields={DEAL_SORT_FIELDS}
              rules={sortRules}
              onChange={setSortRules}
            />
          </div>
        )}
        {activePanel === "group" && (
          <div className="absolute left-6 top-full z-50 mt-1.5">
            <GroupPanel
              visibleStages={visibleStages}
              onChange={(stages) => {
                setVisibleStages(stages);
              }}
            />
          </div>
        )}
      </div>

      {/* ── Search hint ── */}
      {searchQuery && matchedIds !== null && (
        <div className="border-b border-zinc-100 bg-amber-50 px-6 py-1.5 text-xs text-amber-700">
          Showing {matchedIds.size} match{matchedIds.size !== 1 ? "es" : ""} for
          &quot;{searchQuery}&quot; — non-matching cards are dimmed
        </div>
      )}

      {/* ── Board ── */}
      <div className="flex-1 overflow-auto">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-3 p-5" style={{ minWidth: "max-content" }}>
            {DEAL_STAGES.filter((stage) => visibleStages.has(stage.id)).map(
              (stage) => (
                <KanbanColumn
                  key={stage.id}
                  stage={stage}
                  deals={processedDeals.filter((d) => d.stage === stage.id)}
                  matchedIds={matchedIds}
                />
              )
            )}
          </div>
        </DragDropContext>
      </div>
    </div>
  );
}

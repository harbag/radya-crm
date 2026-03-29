"use client";

import React, { useState, useCallback } from "react";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Filter, Plus, X, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ───────────────────────────────────────────────────────────────────

export type FilterDataType = "text" | "number" | "date" | "select";

export type FilterColumnDef = {
  id: string;
  label: string;
  dataType: FilterDataType;
  selectOptions?: { value: string; label: string }[];
};

export type FilterOperator = {
  value: string;
  label: string;
  needsValue: boolean;
};

export type FilterCondition = {
  id: string;
  columnId: string;
  operator: string;
  value: string;
};

export type FilterConjunction = "and" | "or";

export type FilterState = {
  conditions: FilterCondition[];
  conjunction: FilterConjunction;
};

// ── Operators by data type ──────────────────────────────────────────────────

const TEXT_OPERATORS: FilterOperator[] = [
  { value: "contains", label: "contains", needsValue: true },
  { value: "does_not_contain", label: "does not contain", needsValue: true },
  { value: "is", label: "is", needsValue: true },
  { value: "is_not", label: "is not", needsValue: true },
  { value: "starts_with", label: "starts with", needsValue: true },
  { value: "ends_with", label: "ends with", needsValue: true },
  { value: "is_empty", label: "is empty", needsValue: false },
  { value: "is_not_empty", label: "is not empty", needsValue: false },
];

const NUMBER_OPERATORS: FilterOperator[] = [
  { value: "eq", label: "=", needsValue: true },
  { value: "neq", label: "\u2260", needsValue: true },
  { value: "gt", label: ">", needsValue: true },
  { value: "lt", label: "<", needsValue: true },
  { value: "gte", label: "\u2265", needsValue: true },
  { value: "lte", label: "\u2264", needsValue: true },
  { value: "is_empty", label: "is empty", needsValue: false },
  { value: "is_not_empty", label: "is not empty", needsValue: false },
];

const DATE_OPERATORS: FilterOperator[] = [
  { value: "is", label: "is", needsValue: true },
  { value: "is_before", label: "is before", needsValue: true },
  { value: "is_after", label: "is after", needsValue: true },
  { value: "is_on_or_before", label: "is on or before", needsValue: true },
  { value: "is_on_or_after", label: "is on or after", needsValue: true },
  { value: "is_empty", label: "is empty", needsValue: false },
  { value: "is_not_empty", label: "is not empty", needsValue: false },
];

const SELECT_OPERATORS: FilterOperator[] = [
  { value: "is", label: "is", needsValue: true },
  { value: "is_not", label: "is not", needsValue: true },
  { value: "is_empty", label: "is empty", needsValue: false },
  { value: "is_not_empty", label: "is not empty", needsValue: false },
];

export function getOperatorsForType(dataType: FilterDataType): FilterOperator[] {
  switch (dataType) {
    case "text":
      return TEXT_OPERATORS;
    case "number":
      return NUMBER_OPERATORS;
    case "date":
      return DATE_OPERATORS;
    case "select":
      return SELECT_OPERATORS;
  }
}

// ── Filter evaluation ───────────────────────────────────────────────────────

function evaluateCondition(
  condition: FilterCondition,
  row: Record<string, unknown>,
  columnDef: FilterColumnDef
): boolean {
  const rawValue = row[condition.columnId];
  const { operator } = condition;
  const filterValue = condition.value;

  // Handle empty/not-empty first (all types)
  if (operator === "is_empty") {
    return rawValue == null || rawValue === "" || rawValue === 0;
  }
  if (operator === "is_not_empty") {
    return rawValue != null && rawValue !== "" && rawValue !== 0;
  }

  switch (columnDef.dataType) {
    case "text": {
      const cellStr = String(rawValue ?? "").toLowerCase();
      const filterStr = filterValue.toLowerCase();
      switch (operator) {
        case "contains":
          return cellStr.includes(filterStr);
        case "does_not_contain":
          return !cellStr.includes(filterStr);
        case "is":
          return cellStr === filterStr;
        case "is_not":
          return cellStr !== filterStr;
        case "starts_with":
          return cellStr.startsWith(filterStr);
        case "ends_with":
          return cellStr.endsWith(filterStr);
        default:
          return true;
      }
    }

    case "number": {
      const cellNum = Number(rawValue) || 0;
      const filterNum = Number(filterValue) || 0;
      switch (operator) {
        case "eq":
          return cellNum === filterNum;
        case "neq":
          return cellNum !== filterNum;
        case "gt":
          return cellNum > filterNum;
        case "lt":
          return cellNum < filterNum;
        case "gte":
          return cellNum >= filterNum;
        case "lte":
          return cellNum <= filterNum;
        default:
          return true;
      }
    }

    case "date": {
      const cellDate = rawValue ? new Date(String(rawValue)).getTime() : NaN;
      const filterDate = filterValue ? new Date(filterValue).getTime() : NaN;
      if (isNaN(cellDate) || isNaN(filterDate)) return true;
      switch (operator) {
        case "is": {
          // Compare date portion only
          const cd = new Date(cellDate).toISOString().split("T")[0];
          const fd = new Date(filterDate).toISOString().split("T")[0];
          return cd === fd;
        }
        case "is_before":
          return cellDate < filterDate;
        case "is_after":
          return cellDate > filterDate;
        case "is_on_or_before":
          return cellDate <= filterDate;
        case "is_on_or_after":
          return cellDate >= filterDate;
        default:
          return true;
      }
    }

    case "select": {
      const cellStr = String(rawValue ?? "");
      switch (operator) {
        case "is":
          return cellStr === filterValue;
        case "is_not":
          return cellStr !== filterValue;
        default:
          return true;
      }
    }
  }
}

export function evaluateFilters<T extends Record<string, unknown>>(
  row: T,
  filterState: FilterState,
  columnDefs: FilterColumnDef[]
): boolean {
  const { conditions, conjunction } = filterState;
  if (conditions.length === 0) return true;

  const results = conditions.map((condition) => {
    const colDef = columnDefs.find((c) => c.id === condition.columnId);
    if (!colDef) return true;
    return evaluateCondition(condition, row, colDef);
  });

  return conjunction === "and"
    ? results.every(Boolean)
    : results.some(Boolean);
}

// ── Component ───────────────────────────────────────────────────────────────

let conditionCounter = 0;
function nextConditionId() {
  return `cond-${++conditionCounter}`;
}

type FilterBuilderProps = {
  filterColumns: FilterColumnDef[];
  filterState: FilterState;
  onFilterChange: (state: FilterState) => void;
};

export default function FilterBuilder({
  filterColumns,
  filterState,
  onFilterChange,
}: FilterBuilderProps) {
  const [open, setOpen] = useState(false);
  const { conditions, conjunction } = filterState;
  const activeCount = conditions.length;

  const addCondition = useCallback(() => {
    const firstCol = filterColumns[0];
    if (!firstCol) return;
    const ops = getOperatorsForType(firstCol.dataType);
    onFilterChange({
      ...filterState,
      conditions: [
        ...conditions,
        {
          id: nextConditionId(),
          columnId: firstCol.id,
          operator: ops[0].value,
          value: "",
        },
      ],
    });
  }, [filterColumns, filterState, conditions, onFilterChange]);

  const updateCondition = useCallback(
    (id: string, updates: Partial<FilterCondition>) => {
      onFilterChange({
        ...filterState,
        conditions: conditions.map((c) =>
          c.id === id ? { ...c, ...updates } : c
        ),
      });
    },
    [filterState, conditions, onFilterChange]
  );

  const removeCondition = useCallback(
    (id: string) => {
      onFilterChange({
        ...filterState,
        conditions: conditions.filter((c) => c.id !== id),
      });
    },
    [filterState, conditions, onFilterChange]
  );

  const clearAll = useCallback(() => {
    onFilterChange({ conditions: [], conjunction: "and" });
  }, [onFilterChange]);

  const setConjunction = useCallback(
    (conj: FilterConjunction) => {
      onFilterChange({ ...filterState, conjunction: conj });
    },
    [filterState, onFilterChange]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-8 gap-1.5 text-xs",
            activeCount > 0 && "border-indigo-300 bg-indigo-50 text-indigo-700"
          )}
        >
          <Filter className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Filter</span>
          {activeCount > 0 && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-600 px-1 text-[10px] font-semibold text-white">
              {activeCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-auto min-w-[480px] max-w-[90vw] p-3" align="start">
        <div className="space-y-2">
          {/* Header */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-700">
              Filter by conditions
            </span>
            {activeCount > 0 && (
              <button
                onClick={clearAll}
                className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Conditions */}
          {conditions.length === 0 && (
            <p className="py-3 text-center text-xs text-zinc-400">
              No filter conditions. Click &quot;Add condition&quot; to start.
            </p>
          )}

          <div className="space-y-1.5">
            {conditions.map((condition, index) => {
              const colDef = filterColumns.find(
                (c) => c.id === condition.columnId
              );
              const operators = colDef
                ? getOperatorsForType(colDef.dataType)
                : TEXT_OPERATORS;
              const currentOp = operators.find(
                (o) => o.value === condition.operator
              );

              return (
                <div key={condition.id} className="flex items-center gap-1.5">
                  {/* Conjunction label or "Where" */}
                  <div className="w-14 flex-shrink-0 text-right">
                    {index === 0 ? (
                      <span className="text-xs text-zinc-500">Where</span>
                    ) : index === 1 ? (
                      <Select
                        value={conjunction}
                        onValueChange={(v) =>
                          setConjunction(v as FilterConjunction)
                        }
                      >
                        <SelectTrigger className="h-7 w-14 text-xs px-1.5">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="and">And</SelectItem>
                          <SelectItem value="or">Or</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-xs text-zinc-400">
                        {conjunction === "and" ? "And" : "Or"}
                      </span>
                    )}
                  </div>

                  {/* Column selector */}
                  <Select
                    value={condition.columnId}
                    onValueChange={(colId) => {
                      const newCol = filterColumns.find(
                        (c) => c.id === colId
                      );
                      const newOps = newCol
                        ? getOperatorsForType(newCol.dataType)
                        : TEXT_OPERATORS;
                      updateCondition(condition.id, {
                        columnId: colId,
                        operator: newOps[0].value,
                        value: "",
                      });
                    }}
                  >
                    <SelectTrigger className="h-7 w-32 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {filterColumns.map((col) => (
                        <SelectItem key={col.id} value={col.id}>
                          {col.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Operator selector */}
                  <Select
                    value={condition.operator}
                    onValueChange={(op) => {
                      const opDef = operators.find((o) => o.value === op);
                      updateCondition(condition.id, {
                        operator: op,
                        value: opDef?.needsValue ? condition.value : "",
                      });
                    }}
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

                  {/* Value input */}
                  {currentOp?.needsValue !== false && (
                    <ConditionValueInput
                      condition={condition}
                      colDef={colDef}
                      onValueChange={(val) =>
                        updateCondition(condition.id, { value: val })
                      }
                    />
                  )}

                  {/* Remove button */}
                  <button
                    onClick={() => removeCondition(condition.id)}
                    className="flex-shrink-0 rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Add condition */}
          <button
            onClick={addCondition}
            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-700 transition-colors pt-1"
          >
            <Plus className="h-3.5 w-3.5" />
            Add condition
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ── Value Input (adapts to data type) ───────────────────────────────────────

function ConditionValueInput({
  condition,
  colDef,
  onValueChange,
}: {
  condition: FilterCondition;
  colDef: FilterColumnDef | undefined;
  onValueChange: (value: string) => void;
}) {
  if (!colDef) return null;

  // Select type → dropdown of options
  if (colDef.dataType === "select" && colDef.selectOptions) {
    return (
      <Select value={condition.value} onValueChange={onValueChange}>
        <SelectTrigger className="h-7 w-32 text-xs">
          <SelectValue placeholder="Select..." />
        </SelectTrigger>
        <SelectContent>
          {colDef.selectOptions.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  // Date type → date input
  if (colDef.dataType === "date") {
    return (
      <Input
        type="date"
        value={condition.value}
        onChange={(e) => onValueChange(e.target.value)}
        className="h-7 w-36 text-xs"
      />
    );
  }

  // Number type → number input
  if (colDef.dataType === "number") {
    return (
      <Input
        type="number"
        value={condition.value}
        onChange={(e) => onValueChange(e.target.value)}
        placeholder="0"
        className="h-7 w-28 text-xs"
      />
    );
  }

  // Text type → text input
  return (
    <Input
      type="text"
      value={condition.value}
      onChange={(e) => onValueChange(e.target.value)}
      placeholder="Enter a value..."
      className="h-7 w-36 text-xs"
    />
  );
}

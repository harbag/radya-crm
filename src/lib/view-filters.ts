export type FieldType = "string" | "enum" | "number" | "date";

export type FieldDef = {
  key: string;
  label: string;
  type: FieldType;
  options?: { value: string; label: string }[];
};

export type FilterOperator =
  | "contains"
  | "not_contains"
  | "equals"
  | "is_empty"
  | "is_not_empty"
  | "is"
  | "is_not"
  | "gt"
  | "lt"
  | "gte"
  | "lte"
  | "before"
  | "after";

export type FilterCondition = {
  id: string;
  field: string;
  operator: FilterOperator;
  value: string;
};

export type SortRule = {
  id: string;
  field: string;
  direction: "asc" | "desc";
};

export const OPERATORS_FOR_TYPE: Record<
  FieldType,
  { value: FilterOperator; label: string }[]
> = {
  string: [
    { value: "contains", label: "contains" },
    { value: "not_contains", label: "does not contain" },
    { value: "equals", label: "is exactly" },
    { value: "is_empty", label: "is empty" },
    { value: "is_not_empty", label: "is not empty" },
  ],
  enum: [
    { value: "is", label: "is" },
    { value: "is_not", label: "is not" },
  ],
  number: [
    { value: "equals", label: "equals" },
    { value: "gt", label: "greater than" },
    { value: "lt", label: "less than" },
    { value: "gte", label: "≥" },
    { value: "lte", label: "≤" },
  ],
  date: [
    { value: "is", label: "is" },
    { value: "before", label: "is before" },
    { value: "after", label: "is after" },
  ],
};

export function defaultOperatorForType(type: FieldType): FilterOperator {
  return OPERATORS_FOR_TYPE[type][0].value;
}

export function getSortLabels(type: FieldType): { asc: string; desc: string } {
  if (type === "number") return { asc: "Low → High", desc: "High → Low" };
  if (type === "date") return { asc: "Oldest first", desc: "Newest first" };
  return { asc: "A → Z", desc: "Z → A" };
}

export function applyFilter(
  record: Record<string, unknown>,
  condition: FilterCondition,
  fields: FieldDef[]
): boolean {
  const fieldDef = fields.find((f) => f.key === condition.field);
  if (!fieldDef) return true;
  const rawValue = record[condition.field];
  const strVal = String(rawValue ?? "").toLowerCase();
  const condVal = condition.value.toLowerCase();

  switch (condition.operator) {
    case "contains":
      return strVal.includes(condVal);
    case "not_contains":
      return !strVal.includes(condVal);
    case "equals":
    case "is":
      return strVal === condVal;
    case "is_not":
      return strVal !== condVal;
    case "is_empty":
      return strVal === "";
    case "is_not_empty":
      return strVal !== "";
    case "gt":
      return Number(rawValue) > Number(condition.value);
    case "lt":
      return Number(rawValue) < Number(condition.value);
    case "gte":
      return Number(rawValue) >= Number(condition.value);
    case "lte":
      return Number(rawValue) <= Number(condition.value);
    case "before":
      return rawValue
        ? new Date(String(rawValue)) < new Date(condition.value)
        : false;
    case "after":
      return rawValue
        ? new Date(String(rawValue)) > new Date(condition.value)
        : false;
    default:
      return true;
  }
}

export function applySort<T extends Record<string, unknown>>(
  records: T[],
  rules: SortRule[]
): T[] {
  if (rules.length === 0) return records;
  return [...records].sort((a, b) => {
    for (const rule of rules) {
      const aVal = a[rule.field];
      const bVal = b[rule.field];
      let cmp: number;
      if (typeof aVal === "number" && typeof bVal === "number") {
        cmp = aVal - bVal;
      } else {
        cmp = String(aVal ?? "").localeCompare(String(bVal ?? ""));
      }
      if (cmp !== 0) return rule.direction === "asc" ? cmp : -cmp;
    }
    return 0;
  });
}

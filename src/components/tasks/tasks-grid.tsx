"use client";

import React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { CheckSquare } from "lucide-react";
import DataGrid from "@/components/shared/data-grid";
import {
  EditableTextCell,
  LongTextCell,
  createStatusBadgeCell,
  DateCell,
  DateTimeCell,
} from "@/components/shared/grid-cells";
import {
  useTaskList,
  useUpdateTask,
  useArchiveTask,
  type TaskRow,
} from "@/lib/queries/tasks";
import {
  TASK_STATUS_CONFIG,
  TASK_PRIORITY_CONFIG,
  type Task,
} from "@/lib/mock-data";
import type { TaskStatus, TaskPriority, EntityType } from "@/lib/types";
import { GridSkeleton, QueryError } from "@/components/shared/query-states";

function mapTaskRow(row: TaskRow): Task {
  const status: TaskStatus =
    row.status === "completed" ? "done" : "todo";
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    status,
    priority: (row.priority as TaskPriority) ?? "medium",
    dueDate: row.due_date,
    linkedEntityType: (row.entity_type as EntityType) ?? null,
    linkedEntityId: row.entity_id ?? null,
    assignee: row.assignee_id ?? "",
    entityType: row.entity_type ?? undefined,
    entityId: row.entity_id ?? undefined,
    assigneeId: row.assignee_id ?? undefined,
    dueTime: row.due_time ?? undefined,
    completedAt: row.completed_at ?? undefined,
    taskType: row.type ?? undefined,
    createdAt: row.created_at,
    createdBy: row.created_by ?? "",
    lastModifiedAt: row.updated_at,
    lastModifiedBy: "",
  };
}

function taskUpdateFields(updates: Partial<Task>): Partial<TaskRow> {
  const fields: Partial<TaskRow> = {};
  if (updates.title !== undefined) fields.title = updates.title as string;
  if (updates.description !== undefined)
    fields.description = updates.description as string;
  if (updates.priority !== undefined)
    fields.priority = updates.priority as TaskRow["priority"];
  if (updates.status !== undefined) {
    const s = updates.status;
    fields.status =
      s === "done" ? "completed" : "open";
  }
  if (updates.dueDate !== undefined)
    fields.due_date = updates.dueDate as string | null;
  if (updates.assignee !== undefined)
    fields.assignee_id = updates.assignee as string | null;
  return fields;
}

const COLUMN_WIDTHS: Record<string, number> = {
  select: 40,
  rowNum: 40,
  title: 250,
  status: 120,
  priority: 100,
  dueDate: 110,
  assignee: 130,
  description: 200,
  createdAt: 130,
  createdBy: 130,
  lastModifiedAt: 150,
  lastModifiedBy: 130,
  actions: 44,
};

const AUDIT_HIDDEN_COLUMNS = [
  "createdAt",
  "createdBy",
  "lastModifiedAt",
  "lastModifiedBy",
];

const StatusCell = createStatusBadgeCell<Task>(TASK_STATUS_CONFIG, "status");
const PriorityCell = createStatusBadgeCell<Task>(TASK_PRIORITY_CONFIG, "priority");

export default function TasksGrid({
  onRowClick,
  titleExtra,
  toolbarExtra,
  filters,
}: {
  onRowClick?: (row: Task) => void;
  titleExtra?: React.ReactNode;
  toolbarExtra?: React.ReactNode;
  filters?: { assignee_id?: string; entity_type?: TaskRow["entity_type"]; entity_id?: string };
}) {
  const {
    data: rows,
    isLoading,
    error,
    refetch,
  } = useTaskList(filters);
  const updateTask = useUpdateTask();
  const archiveTask = useArchiveTask();

  const tasks: Task[] = (rows ?? []).map(mapTaskRow);

  const statusOptions = Object.entries(TASK_STATUS_CONFIG).map(([key, val]) => ({
    value: key,
    label: val.label,
  }));
  const priorityOptions = Object.entries(TASK_PRIORITY_CONFIG).map(([key, val]) => ({
    value: key,
    label: val.label,
  }));

  const columns: ColumnDef<Task, unknown>[] = [
    {
      accessorKey: "title",
      header: "Title",
      size: COLUMN_WIDTHS.title,
      cell: EditableTextCell,
      filterFn: "includesString",
      meta: { cellType: "text" as const, dataType: "text" as const },
    },
    {
      accessorKey: "status",
      header: "Status",
      size: COLUMN_WIDTHS.status,
      cell: StatusCell,
      filterFn: "equals",
      meta: {
        cellType: "dropdown" as const,
        dataType: "select" as const,
        selectOptions: statusOptions,
      },
    },
    {
      accessorKey: "priority",
      header: "Priority",
      size: COLUMN_WIDTHS.priority,
      cell: PriorityCell,
      filterFn: "equals",
      meta: {
        cellType: "dropdown" as const,
        dataType: "select" as const,
        selectOptions: priorityOptions,
      },
    },
    {
      accessorKey: "dueDate",
      header: "Due Date",
      size: COLUMN_WIDTHS.dueDate,
      cell: DateCell,
      enableColumnFilter: false,
      meta: { cellType: "readonly" as const, dataType: "date" as const },
    },
    {
      accessorKey: "assignee",
      header: "Assignee",
      size: COLUMN_WIDTHS.assignee,
      cell: EditableTextCell,
      filterFn: "includesString",
      meta: { cellType: "text" as const, dataType: "text" as const },
    },
    {
      accessorKey: "description",
      header: "Description",
      size: COLUMN_WIDTHS.description,
      cell: LongTextCell,
      enableColumnFilter: false,
      meta: { cellType: "longtext" as const, dataType: "text" as const },
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      size: COLUMN_WIDTHS.createdAt,
      cell: DateTimeCell,
      enableColumnFilter: false,
      meta: { cellType: "readonly" as const, dataType: "date" as const },
    },
    {
      accessorKey: "createdBy",
      header: "Created By",
      size: COLUMN_WIDTHS.createdBy,
      enableColumnFilter: false,
      meta: { cellType: "readonly" as const, dataType: "text" as const },
      cell: (cellCtx) => {
        const val = cellCtx.getValue() as string;
        return <div className="flex h-full w-full items-center px-2 text-sm text-muted-foreground">{val || "\u2014"}</div>;
      },
    },
    {
      accessorKey: "lastModifiedAt",
      header: "Modified",
      size: COLUMN_WIDTHS.lastModifiedAt,
      cell: DateTimeCell,
      enableColumnFilter: false,
      meta: { cellType: "readonly" as const, dataType: "date" as const },
    },
    {
      accessorKey: "lastModifiedBy",
      header: "Modified By",
      size: COLUMN_WIDTHS.lastModifiedBy,
      enableColumnFilter: false,
      meta: { cellType: "readonly" as const, dataType: "text" as const },
      cell: (cellCtx) => {
        const val = cellCtx.getValue() as string;
        return <div className="flex h-full w-full items-center px-2 text-sm text-muted-foreground">{val || "\u2014"}</div>;
      },
    },
  ];

  if (isLoading) return <GridSkeleton />;
  if (error)
    return <QueryError message={error.message} onRetry={() => refetch()} />;

  return (
    <DataGrid<Task>
      data={tasks}
      columns={columns}
      columnWidths={COLUMN_WIDTHS}
      entityName="Tasks"
      entityIcon={CheckSquare}
      onUpdate={(id, updates) => {
        const dbUpdates = taskUpdateFields(updates);
        if (dbUpdates.status === "completed") {
          updateTask.mutate({
            id,
            ...dbUpdates,
            completed_at: new Date().toISOString(),
          });
        } else {
          updateTask.mutate({ id, ...dbUpdates });
        }
      }}
      onDelete={(ids) => ids.forEach((id) => archiveTask.mutate(id))}
      onRowClick={onRowClick}
      titleExtra={titleExtra}
      toolbarExtra={toolbarExtra}
      addLabel="Add Task"
      defaultHiddenColumns={AUDIT_HIDDEN_COLUMNS}
    />
  );
}

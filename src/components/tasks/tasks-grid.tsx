"use client";

import React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { CheckSquare } from "lucide-react";
import DataGrid from "@/components/shared/data-grid";
import {
  EditableTextCell,
  createStatusBadgeCell,
  DateCell,
} from "@/components/shared/grid-cells";
import { useTasksStore } from "@/store/use-tasks-store";
import {
  TASK_STATUS_CONFIG,
  TASK_PRIORITY_CONFIG,
  type Task,
} from "@/lib/mock-data";

const COLUMN_WIDTHS: Record<string, number> = {
  select: 40,
  rowNum: 40,
  title: 250,
  status: 120,
  priority: 100,
  dueDate: 110,
  assignee: 130,
  description: 200,
  createdAt: 110,
  actions: 44,
};

const StatusCell = createStatusBadgeCell<Task>(TASK_STATUS_CONFIG, "status");
const PriorityCell = createStatusBadgeCell<Task>(
  TASK_PRIORITY_CONFIG,
  "priority"
);

export default function TasksGrid({
  onRowClick,
  titleExtra,
  toolbarExtra,
}: {
  onRowClick?: (row: Task) => void;
  titleExtra?: React.ReactNode;
  toolbarExtra?: React.ReactNode;
}) {
  const { tasks, addTask, updateTask, deleteTasks } = useTasksStore();

  const statusOptions = Object.entries(TASK_STATUS_CONFIG).map(([key, val]) => ({
    value: key,
    label: val.label,
  }));
  const priorityOptions = Object.entries(TASK_PRIORITY_CONFIG).map(([key, val]) => ({
    value: key,
    label: val.label,
  }));

  const columns: ColumnDef<Task, any>[] = [
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
      meta: { cellType: "dropdown" as const, dataType: "select" as const, selectOptions: statusOptions },
    },
    {
      accessorKey: "priority",
      header: "Priority",
      size: COLUMN_WIDTHS.priority,
      cell: PriorityCell,
      filterFn: "equals",
      meta: { cellType: "dropdown" as const, dataType: "select" as const, selectOptions: priorityOptions },
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
      cell: EditableTextCell,
      enableColumnFilter: false,
      meta: { cellType: "text" as const, dataType: "text" as const },
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      size: COLUMN_WIDTHS.createdAt,
      cell: DateCell,
      enableColumnFilter: false,
      meta: { cellType: "readonly" as const, dataType: "date" as const },
    },
  ];

  return (
    <DataGrid<Task>
      data={tasks}
      columns={columns}
      columnWidths={COLUMN_WIDTHS}
      entityName="Tasks"
      entityIcon={CheckSquare}
      onAdd={() =>
        addTask({
          title: "",
          description: "",
          status: "todo",
          priority: "medium",
          dueDate: null,
          linkedEntityType: null,
          linkedEntityId: null,
          assignee: "",
        })
      }
      onUpdate={(id, updates) => updateTask(id, updates as Partial<Task>)}
      onDelete={deleteTasks}
      onRowClick={onRowClick}
      titleExtra={titleExtra}
      toolbarExtra={toolbarExtra}
      addLabel="Add Task"
    />
  );
}

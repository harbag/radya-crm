"use client";

import React, { useState } from "react";
import ViewSwitcher, { type ViewType } from "@/components/shared/view-switcher";
import TasksGrid from "./tasks-grid";
import TaskCard from "./task-card";
import KanbanBoard from "@/components/shared/kanban-board";
import CalendarView from "@/components/shared/calendar-view";
import { useTaskList, useUpdateTask, type TaskRow } from "@/lib/queries/tasks";
import { useCurrentUser } from "@/hooks/use-current-user";
import {
  TASK_STATUS_CONFIG,
  TASK_PRIORITY_CONFIG,
  type Task,
} from "@/lib/mock-data";
import type { TaskStatus, TaskPriority, EntityType } from "@/lib/types";
import { cn } from "@/lib/utils";
import type { FilterColumnDef } from "@/components/shared/filter-builder";
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

const FILTER_COLUMNS: FilterColumnDef[] = [
  { id: "title", label: "Title", dataType: "text" },
  {
    id: "status",
    label: "Status",
    dataType: "select",
    selectOptions: Object.entries(TASK_STATUS_CONFIG).map(([key, val]) => ({
      value: key,
      label: val.label,
    })),
  },
  {
    id: "priority",
    label: "Priority",
    dataType: "select",
    selectOptions: Object.entries(TASK_PRIORITY_CONFIG).map(([key, val]) => ({
      value: key,
      label: val.label,
    })),
  },
  { id: "dueDate", label: "Due Date", dataType: "date" },
  { id: "description", label: "Description", dataType: "text" },
  { id: "createdAt", label: "Created", dataType: "date" },
];

const TASK_STAGES = Object.entries(TASK_STATUS_CONFIG).map(([id, cfg]) => ({
  id,
  label: cfg.label,
}));

const STAGE_COLORS: Record<
  string,
  { dot: string; header: string; droppable: string }
> = {
  todo: {
    dot: "bg-zinc-400",
    header: "text-zinc-700",
    droppable: "bg-zinc-50/60",
  },
  in_progress: {
    dot: "bg-blue-400",
    header: "text-blue-700",
    droppable: "bg-blue-50/60",
  },
  done: {
    dot: "bg-green-400",
    header: "text-green-700",
    droppable: "bg-green-50/60",
  },
};

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isWithin7Days(dateStr: string, today: Date) {
  const d = new Date(dateStr);
  const diff = d.getTime() - today.getTime();
  return diff >= 0 && diff <= 7 * 24 * 60 * 60 * 1000;
}

type TaskGroup = {
  label: string;
  tasks: Task[];
  className: string;
};

function groupTasks(tasks: Task[]): TaskGroup[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const overdue: Task[] = [];
  const dueToday: Task[] = [];
  const dueThisWeek: Task[] = [];
  const upcoming: Task[] = [];
  const noDueDate: Task[] = [];

  for (const task of tasks) {
    if (task.status === "done") continue;
    if (!task.dueDate) {
      noDueDate.push(task);
      continue;
    }
    const d = new Date(task.dueDate);
    d.setHours(0, 0, 0, 0);
    if (d < today) {
      overdue.push(task);
    } else if (isSameDay(d, today)) {
      dueToday.push(task);
    } else if (isWithin7Days(task.dueDate, today)) {
      dueThisWeek.push(task);
    } else {
      upcoming.push(task);
    }
  }

  const groups: TaskGroup[] = [];
  if (overdue.length)
    groups.push({ label: "Overdue", tasks: overdue, className: "text-red-600" });
  if (dueToday.length)
    groups.push({ label: "Due Today", tasks: dueToday, className: "text-amber-600" });
  if (dueThisWeek.length)
    groups.push({ label: "Due This Week", tasks: dueThisWeek, className: "text-blue-600" });
  if (upcoming.length)
    groups.push({ label: "Upcoming", tasks: upcoming, className: "text-zinc-600" });
  if (noDueDate.length)
    groups.push({ label: "No Due Date", tasks: noDueDate, className: "text-zinc-400" });
  return groups;
}

export default function TasksView({
  onRowClick,
}: {
  onRowClick?: (row: Task) => void;
}) {
  const [view, setView] = useState<ViewType>("grid");
  const { data: currentUser } = useCurrentUser();
  const filters = currentUser?.id
    ? { assignee_id: currentUser.id }
    : undefined;
  const { data: rows, isLoading, error, refetch } = useTaskList(filters);
  const updateTask = useUpdateTask();

  const tasks: Task[] = (rows ?? []).map(mapTaskRow);

  const viewSwitcher = (
    <ViewSwitcher
      current={view}
      onChange={setView}
      views={["grid", "kanban", "calendar"]}
    />
  );

  function handleMove(taskId: string, newStatus: string) {
    const dbStatus =
      newStatus === "done" ? "completed" : "open";
    updateTask.mutate({ id: taskId, status: dbStatus as TaskRow["status"] });
  }

  if (isLoading) return <GridSkeleton />;
  if (error) return <QueryError message={error.message} onRetry={() => refetch()} />;

  if (view === "kanban") {
    return (
      <div className="flex h-full flex-col bg-background">
        <div className="flex items-center border-b border-zinc-200 px-3 py-2 sm:px-4 sm:py-2.5">
          <h1 className="mr-3 text-base font-semibold text-zinc-900">Tasks</h1>
          {viewSwitcher}
        </div>
        <div className="flex-1 overflow-hidden">
          <KanbanBoard<Task>
            data={tasks}
            stages={TASK_STAGES}
            getStage={(task) => task.status}
            onMove={(taskId, newStage) => handleMove(taskId, newStage)}
            renderCard={(task, isDragging) => (
              <TaskCard task={task} isDragging={isDragging} />
            )}
            stageColors={STAGE_COLORS}
            onItemClick={onRowClick}
            filterColumns={FILTER_COLUMNS}
          />
        </div>
      </div>
    );
  }

  if (view === "calendar") {
    return (
      <div className="flex h-full flex-col bg-background">
        <div className="flex items-center border-b border-zinc-200 px-3 py-2 sm:px-4 sm:py-2.5">
          <h1 className="mr-3 text-base font-semibold text-zinc-900">Tasks</h1>
          {viewSwitcher}
        </div>
        <div className="flex-1 overflow-hidden">
          <CalendarView<Task>
            items={tasks}
            getDate={(task) => task.dueDate}
            onItemClick={onRowClick}
            entityName="Tasks"
            filterColumns={FILTER_COLUMNS}
            renderItem={(task) => (
              <div
                className={cn(
                  "truncate rounded px-1.5 py-0.5 text-[11px] font-medium",
                  TASK_PRIORITY_CONFIG[task.priority].className
                )}
              >
                {task.title}
              </div>
            )}
          />
        </div>
      </div>
    );
  }

  // Grid view — grouped by due date
  const groups = groupTasks(tasks);
  const doneTasks = tasks.filter((t) => t.status === "done");

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center border-b border-zinc-200 px-3 py-2 sm:px-4 sm:py-2.5">
        <h1 className="mr-3 text-base font-semibold text-zinc-900">Tasks</h1>
        {viewSwitcher}
      </div>
      {tasks.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-sm text-zinc-400">
          No tasks assigned to you.
        </div>
      ) : (
        <div className="flex-1 overflow-auto p-4 space-y-6">
          {groups.map((group) => (
            <div key={group.label}>
              <h2
                className={cn(
                  "mb-2 text-xs font-semibold uppercase tracking-wide",
                  group.className
                )}
              >
                {group.label} ({group.tasks.length})
              </h2>
              <div className="space-y-1">
                {group.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 rounded-lg border border-zinc-100 bg-white px-3 py-2.5 hover:bg-zinc-50 cursor-pointer"
                    onClick={() => onRowClick?.(task)}
                  >
                    <input
                      type="checkbox"
                      checked={task.status === "done"}
                      onChange={(e) => {
                        e.stopPropagation();
                        const newStatus = task.status === "done" ? "open" : "completed";
                        updateTask.mutate({
                          id: task.id,
                          status: newStatus as TaskRow["status"],
                          ...(newStatus === "completed"
                            ? { completed_at: new Date().toISOString() }
                            : { completed_at: null }),
                        });
                      }}
                      className="h-4 w-4 rounded border-zinc-300 accent-indigo-600"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          "text-sm truncate",
                          task.status === "done"
                            ? "line-through text-zinc-400"
                            : "text-zinc-900"
                        )}
                      >
                        {task.title}
                      </p>
                      {task.dueDate && (
                        <p className="text-xs text-zinc-400">
                          {new Date(task.dueDate).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "2-digit",
                          })}
                        </p>
                      )}
                    </div>
                    {task.taskType && (
                      <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600 capitalize">
                        {task.taskType.replace(/_/g, " ")}
                      </span>
                    )}
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium",
                        TASK_PRIORITY_CONFIG[task.priority].className
                      )}
                    >
                      {TASK_PRIORITY_CONFIG[task.priority].label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {doneTasks.length > 0 && (
            <div>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-300">
                Completed ({doneTasks.length})
              </h2>
              <div className="space-y-1">
                {doneTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2.5 cursor-pointer"
                    onClick={() => onRowClick?.(task)}
                  >
                    <input
                      type="checkbox"
                      checked
                      onChange={(e) => {
                        e.stopPropagation();
                        updateTask.mutate({ id: task.id, status: "open", completed_at: null });
                      }}
                      className="h-4 w-4 rounded border-zinc-300 accent-indigo-600"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <p className="flex-1 text-sm text-zinc-400 line-through truncate">
                      {task.title}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

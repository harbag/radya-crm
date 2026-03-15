"use client";

import React, { useState } from "react";
import ViewSwitcher, { type ViewType } from "@/components/shared/view-switcher";
import TasksGrid from "./tasks-grid";
import TaskCard from "./task-card";
import KanbanBoard from "@/components/shared/kanban-board";
import CalendarView from "@/components/shared/calendar-view";
import { useTasksStore } from "@/store/use-tasks-store";
import {
  TASK_STATUS_CONFIG,
  TASK_PRIORITY_CONFIG,
  type Task,
} from "@/lib/mock-data";
import { cn } from "@/lib/utils";

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

export default function TasksView({
  onRowClick,
}: {
  onRowClick?: (row: Task) => void;
}) {
  const [view, setView] = useState<ViewType>("grid");
  const { tasks, moveTaskStatus } = useTasksStore();

  const viewSwitcher = (
    <ViewSwitcher current={view} onChange={setView} views={["grid", "kanban", "calendar"]} />
  );

  if (view === "kanban") {
    return (
      <div className="flex h-full flex-col bg-white">
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-2.5">
          <h1 className="text-base font-semibold text-zinc-900">Tasks</h1>
          {viewSwitcher}
        </div>
        <div className="flex-1 overflow-hidden">
          <KanbanBoard<Task>
            data={tasks}
            stages={TASK_STAGES}
            getStage={(task) => task.status}
            onMove={(taskId, newStage, newIndex) =>
              moveTaskStatus(taskId, newStage as Task["status"], newIndex)
            }
            renderCard={(task, isDragging) => (
              <TaskCard task={task} isDragging={isDragging} />
            )}
            stageColors={STAGE_COLORS}
            onItemClick={onRowClick}
          />
        </div>
      </div>
    );
  }

  if (view === "calendar") {
    return (
      <div className="flex h-full flex-col bg-white">
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-2.5">
          <h1 className="text-base font-semibold text-zinc-900">Tasks</h1>
          {viewSwitcher}
        </div>
        <div className="flex-1 overflow-hidden">
          <CalendarView<Task>
            items={tasks}
            getDate={(task) => task.dueDate}
            onItemClick={onRowClick}
            entityName="Tasks"
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

  return <TasksGrid onRowClick={onRowClick} toolbarExtra={viewSwitcher} />;
}

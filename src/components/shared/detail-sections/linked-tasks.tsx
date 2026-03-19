"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import type { Task } from "@/lib/types";
import { TASK_PRIORITY_CONFIG, TASK_STATUS_CONFIG } from "@/lib/mock-data";
import { CheckCircle, Circle, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const STATUS_ICONS = {
  todo: Circle,
  in_progress: Loader2,
  done: CheckCircle,
};

export default function LinkedTasks({
  tasks,
  onToggle,
  onAdd,
}: {
  tasks: Task[];
  onToggle?: (taskId: string) => void;
  onAdd?: (title: string) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  function handleSubmit() {
    if (!newTitle.trim() || !onAdd) return;
    onAdd(newTitle.trim());
    setNewTitle("");
    setShowForm(false);
  }

  return (
    <div className="space-y-2">
      {onAdd && (
        <div className="mb-3">
          {showForm ? (
            <div className="space-y-2">
              <Input
                placeholder="Task title..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="h-8 text-sm"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmit();
                  if (e.key === "Escape") {
                    setShowForm(false);
                    setNewTitle("");
                  }
                }}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSubmit} className="text-xs">
                  Add Task
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setShowForm(false);
                    setNewTitle("");
                  }}
                  className="text-xs"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowForm(true)}
              className="gap-1.5 text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Task
            </Button>
          )}
        </div>
      )}

      {tasks.length === 0 && !showForm && (
        <p className="py-8 text-center text-sm text-zinc-400">No tasks</p>
      )}

      {tasks.map((task) => {
        const StatusIcon = STATUS_ICONS[task.status];
        const priorityConfig = TASK_PRIORITY_CONFIG[task.priority];
        const statusConfig = TASK_STATUS_CONFIG[task.status];

        return (
          <div
            key={task.id}
            className="flex items-center gap-3 rounded-lg border border-zinc-100 p-2.5 hover:bg-zinc-50 transition-colors"
          >
            <button
              onClick={() => onToggle?.(task.id)}
              className={cn(
                "shrink-0",
                task.status === "done"
                  ? "text-green-500"
                  : "text-zinc-400 hover:text-zinc-600"
              )}
            >
              <StatusIcon className="h-4 w-4" />
            </button>
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  "text-sm font-medium",
                  task.status === "done"
                    ? "text-zinc-400 line-through"
                    : "text-zinc-900"
                )}
              >
                {task.title}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className={cn(
                    "inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                    priorityConfig.className
                  )}
                >
                  {priorityConfig.label}
                </span>
                <span
                  className={cn(
                    "inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                    statusConfig.className
                  )}
                >
                  {statusConfig.label}
                </span>
                {task.dueDate && (
                  <span className="text-[10px] text-zinc-400">
                    Due{" "}
                    {new Date(task.dueDate).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

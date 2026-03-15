import type { Task } from "@/lib/mock-data";
import { TASK_PRIORITY_CONFIG } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export default function TaskCard({
  task,
  isDragging,
}: {
  task: Task;
  isDragging?: boolean;
}) {
  const priorityConfig = TASK_PRIORITY_CONFIG[task.priority];

  return (
    <div
      className={cn(
        "rounded-lg border border-zinc-200 bg-white p-3 transition-shadow",
        isDragging
          ? "shadow-xl ring-2 ring-indigo-400"
          : "shadow-sm hover:shadow-md"
      )}
    >
      <p className="mb-1.5 text-sm font-medium leading-snug text-zinc-900">
        {task.title}
      </p>

      <div className="mb-2 flex items-center gap-2">
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
            priorityConfig.className
          )}
        >
          {priorityConfig.label}
        </span>
      </div>

      {task.assignee && (
        <p className="mb-1 text-xs text-zinc-500">{task.assignee}</p>
      )}

      {task.dueDate && (
        <div className="flex items-center gap-1 text-xs text-zinc-400">
          <span>Due:</span>
          <span>
            {new Date(task.dueDate).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
            })}
          </span>
        </div>
      )}
    </div>
  );
}

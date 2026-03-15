import { create } from "zustand";
import { TASKS, type Task, type TaskStatus } from "@/lib/mock-data";

type TasksState = {
  tasks: Task[];
  addTask: (partial: Omit<Task, "id" | "createdAt">) => string;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  deleteTasks: (ids: string[]) => void;
  toggleTaskStatus: (id: string) => void;
  moveTaskStatus: (taskId: string, newStatus: TaskStatus, newIndex: number) => void;
};

export const useTasksStore = create<TasksState>((set) => ({
  tasks: TASKS,

  addTask: (partial) => {
    const id = `t${Date.now()}`;
    set((state) => ({
      tasks: [
        ...state.tasks,
        {
          ...partial,
          id,
          createdAt: new Date().toISOString().split("T")[0],
        },
      ],
    }));
    return id;
  },

  updateTask: (id, updates) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id ? { ...t, ...updates } : t
      ),
    })),

  deleteTask: (id) =>
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
    })),

  deleteTasks: (ids) =>
    set((state) => ({
      tasks: state.tasks.filter((t) => !ids.includes(t.id)),
    })),

  toggleTaskStatus: (id) =>
    set((state) => ({
      tasks: state.tasks.map((t) => {
        if (t.id !== id) return t;
        const next: TaskStatus =
          t.status === "todo"
            ? "in_progress"
            : t.status === "in_progress"
              ? "done"
              : "todo";
        return { ...t, status: next };
      }),
    })),

  moveTaskStatus: (taskId, newStatus, newIndex) =>
    set((state) => {
      const task = state.tasks.find((t) => t.id === taskId);
      if (!task) return state;

      const withoutTask = state.tasks.filter((t) => t.id !== taskId);
      const updatedTask: Task = { ...task, status: newStatus };

      const statusTasks = withoutTask.filter((t) => t.status === newStatus);
      const otherTasks = withoutTask.filter((t) => t.status !== newStatus);
      statusTasks.splice(newIndex, 0, updatedTask);
      return { tasks: [...otherTasks, ...statusTasks] };
    }),
}));

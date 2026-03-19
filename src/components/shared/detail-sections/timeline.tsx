"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import type { Activity, Note, Task } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Phone,
  Mail,
  Calendar,
  FileText,
  CheckCircle,
  TrendingUp,
  ArrowRightLeft,
  UserPlus,
  Building2,
  Circle,
  Loader2,
  StickyNote,
  Plus,
  ListTodo,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

type TimelineEntry = {
  id: string;
  kind: "activity" | "note" | "task";
  date: string;
  data: Activity | Note | Task;
};

type TimelineProps = {
  activities: Activity[];
  notes: Note[];
  tasks: Task[];
  onAddNote?: (content: string) => void;
  onAddTask?: (title: string) => void;
  onToggleTask?: (taskId: string) => void;
};

// ── Icon/color maps ──────────────────────────────────────────────────────────

const ACTIVITY_ICONS: Record<string, typeof Phone> = {
  call: Phone,
  email: Mail,
  meeting: Calendar,
  note_added: FileText,
  task_completed: CheckCircle,
  deal_created: TrendingUp,
  deal_stage_changed: ArrowRightLeft,
  lead_status_changed: ArrowRightLeft,
  contact_created: UserPlus,
  company_created: Building2,
};

const ACTIVITY_COLORS: Record<string, string> = {
  call: "bg-blue-100 text-blue-600",
  email: "bg-green-100 text-green-600",
  meeting: "bg-purple-100 text-purple-600",
  note_added: "bg-yellow-100 text-yellow-600",
  task_completed: "bg-emerald-100 text-emerald-600",
  deal_created: "bg-indigo-100 text-indigo-600",
  deal_stage_changed: "bg-orange-100 text-orange-600",
  lead_status_changed: "bg-amber-100 text-amber-600",
  contact_created: "bg-cyan-100 text-cyan-600",
  company_created: "bg-teal-100 text-teal-600",
};

const TASK_STATUS_ICONS = {
  todo: Circle,
  in_progress: Loader2,
  done: CheckCircle,
};

// ── Component ────────────────────────────────────────────────────────────────

export default function Timeline({
  activities,
  notes,
  tasks,
  onAddNote,
  onAddTask,
  onToggleTask,
}: TimelineProps) {
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [newTask, setNewTask] = useState("");

  // Merge all entries into a single timeline sorted newest first
  const entries: TimelineEntry[] = [
    ...activities.map((a) => ({
      id: a.id,
      kind: "activity" as const,
      date: a.createdAt,
      data: a,
    })),
    ...notes.map((n) => ({
      id: n.id,
      kind: "note" as const,
      date: n.createdAt,
      data: n,
    })),
    ...tasks.map((t) => ({
      id: t.id,
      kind: "task" as const,
      date: t.createdAt,
      data: t,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  function handleAddNote() {
    if (!newNote.trim() || !onAddNote) return;
    onAddNote(newNote.trim());
    setNewNote("");
    setShowNoteForm(false);
  }

  function handleAddTask() {
    if (!newTask.trim() || !onAddTask) return;
    onAddTask(newTask.trim());
    setNewTask("");
    setShowTaskForm(false);
  }

  return (
    <div className="space-y-4">
      {/* Quick-add buttons */}
      <div className="flex flex-wrap gap-2">
        {onAddNote && !showNoteForm && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setShowNoteForm(true);
              setShowTaskForm(false);
            }}
            className="gap-1.5 text-xs"
          >
            <StickyNote className="h-3.5 w-3.5" />
            Add Note
          </Button>
        )}
        {onAddTask && !showTaskForm && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setShowTaskForm(true);
              setShowNoteForm(false);
            }}
            className="gap-1.5 text-xs"
          >
            <ListTodo className="h-3.5 w-3.5" />
            Add Task
          </Button>
        )}
      </div>

      {/* Note form */}
      {showNoteForm && (
        <div className="space-y-2 rounded-lg border border-zinc-200 p-3">
          <Textarea
            placeholder="Write a note..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            className="min-h-[80px] text-sm"
            autoFocus
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAddNote} className="text-xs">
              Save Note
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setShowNoteForm(false);
                setNewNote("");
              }}
              className="text-xs"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Task form */}
      {showTaskForm && (
        <div className="space-y-2 rounded-lg border border-zinc-200 p-3">
          <Input
            placeholder="Task title..."
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            className="h-8 text-sm"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddTask();
              if (e.key === "Escape") {
                setShowTaskForm(false);
                setNewTask("");
              }
            }}
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAddTask} className="text-xs">
              Add Task
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setShowTaskForm(false);
                setNewTask("");
              }}
              className="text-xs"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Timeline */}
      {entries.length === 0 && !showNoteForm && !showTaskForm && (
        <p className="py-8 text-center text-sm text-zinc-400">
          No activity yet
        </p>
      )}

      <div className="relative">
        {/* Vertical line */}
        {entries.length > 0 && (
          <div className="absolute left-3.5 top-2 bottom-2 w-px bg-zinc-200" />
        )}

        <div className="space-y-0">
          {entries.map((entry) => (
            <TimelineItem
              key={`${entry.kind}-${entry.id}`}
              entry={entry}
              onToggleTask={onToggleTask}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Timeline Item ────────────────────────────────────────────────────────────

function TimelineItem({
  entry,
  onToggleTask,
}: {
  entry: TimelineEntry;
  onToggleTask?: (taskId: string) => void;
}) {
  const dateStr = formatTimelineDate(entry.date);

  if (entry.kind === "activity") {
    const activity = entry.data as Activity;
    const Icon = ACTIVITY_ICONS[activity.type] ?? FileText;
    const colorClass =
      ACTIVITY_COLORS[activity.type] ?? "bg-zinc-100 text-zinc-600";

    return (
      <div className="relative flex gap-3 py-2.5 pl-0">
        <div
          className={cn(
            "z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
            colorClass
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="text-sm text-zinc-700">{activity.description}</p>
          <p className="text-xs text-zinc-400 mt-0.5">{dateStr}</p>
        </div>
      </div>
    );
  }

  if (entry.kind === "note") {
    const note = entry.data as Note;
    return (
      <div className="relative flex gap-3 py-2.5 pl-0">
        <div className="z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-yellow-100 text-yellow-600">
          <StickyNote className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="rounded-lg border border-zinc-100 bg-zinc-50/50 p-2.5">
            <p className="text-sm text-zinc-700 whitespace-pre-wrap">
              {note.content}
            </p>
          </div>
          <p className="text-xs text-zinc-400 mt-1">{dateStr}</p>
        </div>
      </div>
    );
  }

  if (entry.kind === "task") {
    const task = entry.data as Task;
    const StatusIcon = TASK_STATUS_ICONS[task.status];
    return (
      <div className="relative flex gap-3 py-2.5 pl-0">
        <button
          onClick={() => onToggleTask?.(task.id)}
          className={cn(
            "z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
            task.status === "done"
              ? "bg-emerald-100 text-emerald-600"
              : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
          )}
        >
          <StatusIcon className="h-3.5 w-3.5" />
        </button>
        <div className="min-w-0 flex-1 pt-0.5">
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
          <p className="text-xs text-zinc-400 mt-0.5">
            Task created &middot; {dateStr}
          </p>
        </div>
      </div>
    );
  }

  return null;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatTimelineDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

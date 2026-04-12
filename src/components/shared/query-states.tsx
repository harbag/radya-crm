"use client";

import { RefreshCw, AlertCircle, Plus } from "lucide-react";

export function GridSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="flex h-full flex-col bg-background">
      <div className="animate-pulse space-y-0">
        <div className="flex items-center gap-3 border-b border-zinc-200 px-4 py-3">
          <div className="h-4 w-4 rounded bg-zinc-200" />
          <div className="h-4 w-4 rounded bg-zinc-200" />
          <div className="h-4 flex-1 max-w-[160px] rounded bg-zinc-200" />
          <div className="h-4 flex-1 max-w-[200px] rounded bg-zinc-200" />
          <div className="h-4 flex-1 max-w-[140px] rounded bg-zinc-200" />
          <div className="h-4 flex-1 max-w-[120px] rounded bg-zinc-200" />
        </div>
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 border-b border-zinc-100 px-4 py-3"
          >
            <div className="h-4 w-4 rounded bg-zinc-100" />
            <div className="h-4 w-6 rounded bg-zinc-100" />
            <div className="h-4 flex-1 max-w-[160px] rounded bg-zinc-100" />
            <div className="h-4 flex-1 max-w-[200px] rounded bg-zinc-100" />
            <div className="h-4 flex-1 max-w-[140px] rounded bg-zinc-100" />
            <div className="h-4 flex-1 max-w-[120px] rounded bg-zinc-100" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function QueryError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 bg-background p-8">
      <div className="flex items-center gap-2 text-red-500">
        <AlertCircle className="h-5 w-5" />
        <p className="text-sm font-medium">Failed to load data</p>
      </div>
      <p className="max-w-sm text-center text-sm text-zinc-500">{message}</p>
      <button
        onClick={onRetry}
        className="flex items-center gap-2 rounded-md border border-zinc-200 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        Try again
      </button>
    </div>
  );
}

export function EmptyState({
  entity,
  onAdd,
}: {
  entity: string;
  onAdd?: () => void;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 bg-background text-center p-8">
      <p className="text-sm font-medium text-zinc-600">No {entity} yet</p>
      <p className="text-sm text-zinc-400">
        Get started by adding your first record.
      </p>
      {onAdd && (
        <button
          onClick={onAdd}
          className="flex items-center gap-1.5 rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700"
        >
          <Plus className="h-3.5 w-3.5" />
          Add {entity.replace(/s$/, "")}
        </button>
      )}
    </div>
  );
}

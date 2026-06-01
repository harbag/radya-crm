'use client'

import React, { useMemo, useRef } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table'
import {
  ChevronRight,
  IndentIncrease,
  IndentDecrease,
  Plus,
  Trash2,
  FileText,
  AlertTriangle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { FlatRow } from '@/lib/wbs-tree'
import type { UserOption } from '@/lib/queries/wbs'

export const WBS_ROW_HEIGHT = 36
export const WBS_HEADER_HEIGHT = 36

export type WbsGridHandlers = {
  rollups: Map<string, number>
  weightWarnings: Set<string> // ids of parents whose children weights != 100
  users: UserOption[]
  selectedId: string | null
  onSelect: (id: string) => void
  onToggleCollapse: (id: string) => void
  collapsed: Set<string>
  onUpdate: (id: string, updates: Record<string, unknown>) => void
  onIndent: (id: string) => void
  onOutdent: (id: string) => void
  canIndent: (id: string) => boolean
  canOutdent: (id: string) => boolean
  onAddChild: (id: string) => void
  onAddSibling: (id: string) => void
  onDelete: (id: string) => void
  onOpenDoc: (id: string) => void
}

type WbsGridProps = WbsGridHandlers & {
  rows: FlatRow[]
}

// ── Inline edit primitives ────────────────────────────────────────────────────

function TextInputCell({
  value,
  onCommit,
  className,
}: {
  value: string
  onCommit: (v: string) => void
  className?: string
}) {
  // Uncontrolled + `key` so external value changes reset the field without a
  // prop→state effect (which React Compiler lint disallows). While typing, the
  // parent value is unchanged so the key is stable and focus is preserved.
  return (
    <input
      key={value}
      defaultValue={value}
      onBlur={(e) => e.target.value !== value && onCommit(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.currentTarget.blur()
        } else if (e.key === 'Escape') {
          e.currentTarget.value = value
          e.currentTarget.blur()
        }
      }}
      className={cn(
        'h-full w-full bg-transparent px-2 text-sm outline-none focus:bg-background focus:ring-1 focus:ring-indigo-300',
        className
      )}
    />
  )
}

function NumberInputCell({
  value,
  onCommit,
  min = 0,
  max = 100,
  suffix,
  disabled,
}: {
  value: number | null
  onCommit: (v: number) => void
  min?: number
  max?: number
  suffix?: string
  disabled?: boolean
}) {
  if (disabled) {
    return (
      <div className="flex h-full w-full items-center px-2 text-sm text-zinc-400">
        {value == null ? '—' : `${value}${suffix ?? ''}`}
      </div>
    )
  }

  const display = value == null ? '' : String(value)
  const commit = (el: HTMLInputElement) => {
    const n = parseFloat(el.value)
    if (isNaN(n)) {
      el.value = display
      return
    }
    const clamped = Math.min(max, Math.max(min, n))
    if (clamped !== value) onCommit(clamped)
    el.value = String(clamped)
  }

  return (
    <div className="flex h-full w-full items-center">
      <input
        key={display}
        type="number"
        defaultValue={display}
        min={min}
        max={max}
        onBlur={(e) => commit(e.currentTarget)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur()
          else if (e.key === 'Escape') {
            e.currentTarget.value = display
            e.currentTarget.blur()
          }
        }}
        className="h-full w-full bg-transparent px-2 text-sm tabular-nums outline-none focus:bg-background focus:ring-1 focus:ring-indigo-300"
      />
    </div>
  )
}

function DateInputCell({
  value,
  onCommit,
}: {
  value: string | null
  onCommit: (v: string | null) => void
}) {
  // value stored as ISO date string (yyyy-mm-dd) or null
  const dateVal = value ? value.slice(0, 10) : ''
  return (
    <input
      type="date"
      value={dateVal}
      onChange={(e) => onCommit(e.target.value || null)}
      className="h-full w-full bg-transparent px-2 text-sm text-zinc-600 outline-none focus:bg-background focus:ring-1 focus:ring-indigo-300"
    />
  )
}

function AssigneeCell({
  value,
  users,
  onCommit,
}: {
  value: string | null
  users: UserOption[]
  onCommit: (v: string | null) => void
}) {
  return (
    <select
      value={value ?? ''}
      onChange={(e) => onCommit(e.target.value || null)}
      className="h-full w-full cursor-pointer bg-transparent px-2 text-sm text-zinc-600 outline-none focus:bg-background focus:ring-1 focus:ring-indigo-300"
    >
      <option value="">—</option>
      {users.map((u) => (
        <option key={u.id} value={u.id}>
          {u.name}
        </option>
      ))}
    </select>
  )
}

function ProgressCell({ value }: { value: number }) {
  return (
    <div className="flex h-full w-full items-center gap-2 px-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-100">
        <div
          className="h-full rounded-full bg-indigo-500"
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
      <span className="w-9 shrink-0 text-right text-xs tabular-nums text-zinc-500">
        {Math.round(value)}%
      </span>
    </div>
  )
}

// ── Columns ─────────────────────────────────────────────────────────────────--

const COLUMN_WIDTHS = {
  wbs: 64,
  title: 320,
  assignee: 140,
  start: 132,
  end: 132,
  duration: 80,
  progress: 150,
  weight: 96,
  actions: 96,
} as const

function buildColumns(h: WbsGridHandlers): ColumnDef<FlatRow>[] {
  return [
    {
      id: 'wbs',
      header: 'WBS',
      size: COLUMN_WIDTHS.wbs,
      cell: ({ row }) => (
        <div className="flex h-full w-full items-center px-2 text-xs font-medium tabular-nums text-zinc-400">
          {row.original.wbsCode}
        </div>
      ),
    },
    {
      id: 'title',
      header: 'Task',
      size: COLUMN_WIDTHS.title,
      cell: ({ row }) => {
        const r = row.original
        const isExpanded = !h.collapsed.has(r.id)
        const isSummary = r.hasChildren
        const hasWeightWarning = h.weightWarnings.has(r.id)
        return (
          <div
            className="group/title flex h-full w-full items-center"
            style={{ paddingLeft: (r.depth - 1) * 16 }}
          >
            {isSummary ? (
              <button
                onClick={() => h.onToggleCollapse(r.id)}
                className="flex h-5 w-5 shrink-0 items-center justify-center text-zinc-400 hover:text-zinc-700"
                title={isExpanded ? 'Collapse' : 'Expand'}
              >
                <ChevronRight
                  className={cn(
                    'h-4 w-4 transition-transform',
                    isExpanded && 'rotate-90'
                  )}
                />
              </button>
            ) : (
              <span className="w-5 shrink-0" />
            )}
            <TextInputCell
              value={r.title}
              onCommit={(v) => h.onUpdate(r.id, { title: v })}
              className={cn(isSummary && 'font-semibold text-zinc-800')}
            />
            {hasWeightWarning && (
              <span
                title="Children weights do not sum to 100%"
                className="mr-1 shrink-0 text-amber-500"
              >
                <AlertTriangle className="h-3.5 w-3.5" />
              </span>
            )}
            <button
              onClick={() => h.onOpenDoc(r.id)}
              title="Open document"
              className="mr-1 shrink-0 rounded p-1 text-zinc-400 opacity-0 transition-opacity hover:bg-zinc-100 hover:text-indigo-600 group-hover/title:opacity-100"
            >
              <FileText className="h-3.5 w-3.5" />
            </button>
          </div>
        )
      },
    },
    {
      id: 'assignee',
      header: 'Assignee',
      size: COLUMN_WIDTHS.assignee,
      cell: ({ row }) => (
        <AssigneeCell
          value={row.original.assignee_id}
          users={h.users}
          onCommit={(v) => h.onUpdate(row.original.id, { assignee_id: v })}
        />
      ),
    },
    {
      id: 'start',
      header: 'Start',
      size: COLUMN_WIDTHS.start,
      cell: ({ row }) => (
        <DateInputCell
          value={row.original.start_date}
          onCommit={(v) => h.onUpdate(row.original.id, { start_date: v })}
        />
      ),
    },
    {
      id: 'end',
      header: 'End',
      size: COLUMN_WIDTHS.end,
      cell: ({ row }) => (
        <DateInputCell
          value={row.original.end_date}
          onCommit={(v) => h.onUpdate(row.original.id, { end_date: v })}
        />
      ),
    },
    {
      id: 'duration',
      header: 'Days',
      size: COLUMN_WIDTHS.duration,
      cell: ({ row }) => (
        <NumberInputCell
          value={row.original.duration_days}
          min={0}
          max={100000}
          onCommit={(v) => h.onUpdate(row.original.id, { duration_days: v })}
        />
      ),
    },
    {
      id: 'progress',
      header: 'Progress',
      size: COLUMN_WIDTHS.progress,
      cell: ({ row }) => {
        const r = row.original
        if (r.hasChildren) {
          return <ProgressCell value={h.rollups.get(r.id) ?? 0} />
        }
        return (
          <div className="flex h-full w-full items-center">
            <NumberInputCell
              value={r.progress_percent}
              min={0}
              max={100}
              suffix="%"
              onCommit={(v) => h.onUpdate(r.id, { progress_percent: v })}
            />
          </div>
        )
      },
    },
    {
      id: 'weight',
      header: 'Weight',
      size: COLUMN_WIDTHS.weight,
      cell: ({ row }) => (
        <NumberInputCell
          value={row.original.weight_percent}
          min={0}
          max={100}
          suffix="%"
          onCommit={(v) => h.onUpdate(row.original.id, { weight_percent: v })}
        />
      ),
    },
    {
      id: 'actions',
      header: '',
      size: COLUMN_WIDTHS.actions,
      cell: ({ row }) => {
        const r = row.original
        return (
          <div className="flex h-full w-full items-center justify-end gap-0.5 px-1 opacity-0 group-hover/row:opacity-100">
            <button
              onClick={() => h.onOutdent(r.id)}
              disabled={!h.canOutdent(r.id)}
              title="Outdent (Shift+Tab)"
              className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <IndentDecrease className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => h.onIndent(r.id)}
              disabled={!h.canIndent(r.id)}
              title="Indent (Tab) — max 4 levels"
              className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <IndentIncrease className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => h.onAddChild(r.id)}
              disabled={r.depth >= 4}
              title="Add subtask"
              className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => h.onDelete(r.id)}
              title="Delete"
              className="rounded p-1 text-zinc-400 hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )
      },
    },
  ]
}

// ── Grid ──────────────────────────────────────────────────────────────────────

export default function WbsGrid(props: WbsGridProps) {
  const { rows, ...handlers } = props
  const columns = useMemo(() => buildColumns(handlers), [handlers])
  const containerRef = useRef<HTMLDivElement>(null)

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (r) => r.id,
  })

  const totalWidth = Object.values(COLUMN_WIDTHS).reduce((a, b) => a + b, 0)

  return (
    <div
      ref={containerRef}
      className="min-w-fit"
      style={{ width: totalWidth }}
      onKeyDown={(e) => {
        if (!handlers.selectedId) return
        if (e.key === 'Tab') {
          e.preventDefault()
          if (e.shiftKey) {
            if (handlers.canOutdent(handlers.selectedId))
              handlers.onOutdent(handlers.selectedId)
          } else {
            if (handlers.canIndent(handlers.selectedId))
              handlers.onIndent(handlers.selectedId)
          }
        }
      }}
    >
      {/* Header */}
      <div
        className="sticky top-0 z-10 flex border-b border-zinc-200 bg-zinc-50"
        style={{ height: WBS_HEADER_HEIGHT }}
      >
        {table.getFlatHeaders().map((header) => (
          <div
            key={header.id}
            className="flex items-center px-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500"
            style={{ width: header.getSize() }}
          >
            {flexRender(header.column.columnDef.header, header.getContext())}
          </div>
        ))}
      </div>

      {/* Body */}
      <div>
        {table.getRowModel().rows.map((row) => {
          const isSelected = handlers.selectedId === row.original.id
          return (
            <div
              key={row.id}
              onClick={() => handlers.onSelect(row.original.id)}
              tabIndex={0}
              className={cn(
                'group/row flex border-b border-zinc-100 outline-none',
                isSelected ? 'bg-indigo-50/60' : 'hover:bg-zinc-50',
                row.original.hasChildren && 'bg-zinc-50/40'
              )}
              style={{ height: WBS_ROW_HEIGHT }}
            >
              {row.getVisibleCells().map((cell) => (
                <div
                  key={cell.id}
                  className="border-r border-zinc-100 last:border-r-0"
                  style={{ width: cell.column.getSize() }}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}

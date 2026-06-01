'use client'

import React, { useMemo } from 'react'
import { cn } from '@/lib/utils'
import type { FlatRow } from '@/lib/wbs-tree'
import {
  computeScale,
  barGeometry,
  todayOffset,
  type ScaleUnit,
} from '@/lib/gantt-scale'
import { WBS_ROW_HEIGHT, WBS_HEADER_HEIGHT } from './wbs-grid'

type WbsGanttProps = {
  rows: FlatRow[]
  rollups: Map<string, number>
  unit: ScaleUnit
  selectedId: string | null
  onSelect: (id: string) => void
  projectStart?: string | null
  projectEnd?: string | null
}

export default function WbsGantt({
  rows,
  rollups,
  unit,
  selectedId,
  onSelect,
  projectStart,
  projectEnd,
}: WbsGanttProps) {
  // Scale is derived from the full set of rows (not just visible) so collapsing
  // doesn't shrink the timeline.
  const scale = useMemo(
    () => computeScale(rows, unit, projectStart, projectEnd),
    [rows, unit, projectStart, projectEnd]
  )
  const today = todayOffset(scale)

  return (
    <div className="min-w-fit" style={{ width: scale.totalWidth }}>
      {/* Timeline header */}
      <div
        className="sticky top-0 z-10 flex border-b border-zinc-200 bg-zinc-50"
        style={{ height: WBS_HEADER_HEIGHT, width: scale.totalWidth }}
      >
        {scale.columns.map((col, i) => {
          const width =
            scale.unit === 'day' ? scale.pxPerDay : scale.pxPerDay * 7
          const isWeekend =
            scale.unit === 'day' &&
            (col.date.getDay() === 0 || col.date.getDay() === 6)
          return (
            <div
              key={i}
              className={cn(
                'flex shrink-0 items-center justify-center border-r border-zinc-100 text-[10px] tabular-nums text-zinc-500',
                isWeekend && 'bg-zinc-100/70',
                col.isWeekStart && 'border-l border-l-zinc-300'
              )}
              style={{ width }}
            >
              {col.label}
            </div>
          )
        })}
      </div>

      {/* Rows */}
      <div className="relative">
        {/* Today marker */}
        {today != null && (
          <div
            className="pointer-events-none absolute top-0 z-20 w-px bg-rose-400/70"
            style={{ left: today, height: rows.length * WBS_ROW_HEIGHT }}
          />
        )}

        {rows.map((r) => {
          const geo = barGeometry(r, scale)
          const isSummary = r.hasChildren
          const progress = isSummary
            ? (rollups.get(r.id) ?? 0)
            : r.progress_percent
          const isSelected = selectedId === r.id
          return (
            <div
              key={r.id}
              onClick={() => onSelect(r.id)}
              className={cn(
                'relative border-b border-zinc-100',
                isSelected ? 'bg-indigo-50/60' : 'hover:bg-zinc-50',
                isSummary && 'bg-zinc-50/40'
              )}
              style={{ height: WBS_ROW_HEIGHT }}
            >
              {geo &&
                (r.is_milestone ? (
                  <Milestone left={geo.left} />
                ) : isSummary ? (
                  <SummaryBar
                    left={geo.left}
                    width={geo.width}
                    progress={progress}
                  />
                ) : (
                  <LeafBar
                    left={geo.left}
                    width={geo.width}
                    progress={progress}
                    label={r.title}
                  />
                ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Bar variants ────────────────────────────────────────────────────────────--

function LeafBar({
  left,
  width,
  progress,
  label,
}: {
  left: number
  width: number
  progress: number
  label: string
}) {
  return (
    <div
      className="absolute top-1/2 flex h-4 -translate-y-1/2 items-center overflow-hidden rounded bg-indigo-200"
      style={{ left, width }}
      title={`${label} — ${Math.round(progress)}%`}
    >
      <div
        className="absolute left-0 top-0 h-full bg-indigo-500"
        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
      />
      <span className="relative z-10 truncate px-1.5 text-[10px] font-medium text-indigo-900/80">
        {Math.round(progress)}%
      </span>
    </div>
  )
}

/**
 * MS-Project-style summary bar: a thin black bar spanning the children's extent
 * with downward bracket "ears" at each end.
 */
function SummaryBar({
  left,
  width,
  progress,
}: {
  left: number
  width: number
  progress: number
}) {
  return (
    <div
      className="absolute top-1/2 -translate-y-1/2"
      style={{ left, width }}
      title={`Summary — ${Math.round(progress)}%`}
    >
      <div className="relative h-2.5 overflow-hidden rounded-sm bg-zinc-900">
        <div
          className="absolute left-0 top-0 h-full bg-indigo-400"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
      {/* bracket ears */}
      <div
        className="absolute top-2.5 h-0 w-0"
        style={{
          left: 0,
          borderLeft: '4px solid transparent',
          borderRight: '4px solid transparent',
          borderTop: '5px solid rgb(24 24 27)',
        }}
      />
      <div
        className="absolute top-2.5 h-0 w-0"
        style={{
          right: 0,
          borderLeft: '4px solid transparent',
          borderRight: '4px solid transparent',
          borderTop: '5px solid rgb(24 24 27)',
        }}
      />
    </div>
  )
}

function Milestone({ left }: { left: number }) {
  return (
    <div
      className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[2px] bg-zinc-900"
      style={{ left }}
      title="Milestone"
    />
  )
}

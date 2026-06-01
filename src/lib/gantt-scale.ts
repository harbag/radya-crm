import type { WbsTaskRow } from '@/lib/queries/wbs'

export type ScaleUnit = 'day' | 'week'

export type GanttColumn = {
  date: Date
  label: string
  isWeekStart: boolean
}

export type GanttScale = {
  min: Date
  max: Date
  unit: ScaleUnit
  pxPerDay: number
  columns: GanttColumn[]
  totalWidth: number
}

const MS_PER_DAY = 24 * 60 * 60 * 1000

function parseDate(s: string | null | undefined): Date | null {
  if (!s) return null
  const d = new Date(s)
  return isNaN(d.getTime()) ? null : d
}

/** Whole-day difference (b - a), ignoring time-of-day. */
export function daysBetween(a: Date, b: Date): number {
  const ua = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())
  const ub = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate())
  return Math.round((ub - ua) / MS_PER_DAY)
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

/**
 * Compute the timeline scale spanning every task's date range, padded a few days
 * on each side. Falls back to a sensible window around today when no tasks have
 * dates. pxPerDay scales down for the coarser 'week' unit.
 */
export function computeScale(
  rows: WbsTaskRow[],
  unit: ScaleUnit,
  fallbackStart?: string | null,
  fallbackEnd?: string | null
): GanttScale {
  let min: Date | null = null
  let max: Date | null = null

  const consider = (s: string | null | undefined) => {
    const d = parseDate(s)
    if (!d) return
    if (!min || d < min) min = d
    if (!max || d > max) max = d
  }

  for (const r of rows) {
    consider(r.start_date)
    consider(r.end_date)
  }
  consider(fallbackStart)
  consider(fallbackEnd)

  const today = new Date()
  if (!min || !max) {
    min = addDays(today, -7)
    max = addDays(today, 30)
  }

  // Pad and normalize to whole days.
  const start = addDays(min, -3)
  const end = addDays(max, 3)
  const totalDays = Math.max(daysBetween(start, end) + 1, 1)

  const pxPerDay = unit === 'day' ? 32 : 12

  const columns: GanttColumn[] = []
  if (unit === 'day') {
    for (let i = 0; i < totalDays; i++) {
      const d = addDays(start, i)
      columns.push({
        date: d,
        label: `${d.getDate()}`,
        isWeekStart: d.getDay() === 1,
      })
    }
  } else {
    // One column per week (Monday-aligned).
    let cursor = new Date(start)
    const back = (cursor.getDay() + 6) % 7 // days since Monday
    cursor = addDays(cursor, -back)
    while (cursor <= end) {
      columns.push({
        date: new Date(cursor),
        label: `${MONTHS[cursor.getMonth()]} ${cursor.getDate()}`,
        isWeekStart: true,
      })
      cursor = addDays(cursor, 7)
    }
  }

  return {
    min: start,
    max: end,
    unit,
    pxPerDay,
    columns,
    totalWidth: totalDays * pxPerDay,
  }
}

export type BarGeometry = { left: number; width: number }

/**
 * Pixel geometry for a task bar within the scale. Returns null when the task has
 * no usable date range. duration defaults to 1 day so zero-length tasks remain
 * visible.
 */
export function barGeometry(
  row: { start_date: string | null; end_date: string | null },
  scale: GanttScale
): BarGeometry | null {
  const start = parseDate(row.start_date)
  const end = parseDate(row.end_date) ?? start
  if (!start) return null

  const left = daysBetween(scale.min, start) * scale.pxPerDay
  const spanDays = Math.max(daysBetween(start, end ?? start) + 1, 1)
  const width = spanDays * scale.pxPerDay
  return { left, width }
}

/** Pixel offset of "today" within the scale, or null if out of range. */
export function todayOffset(scale: GanttScale): number | null {
  const today = new Date()
  if (today < scale.min || today > scale.max) return null
  return daysBetween(scale.min, today) * scale.pxPerDay
}

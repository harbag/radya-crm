import { create } from 'zustand'
import type { ScaleUnit } from '@/lib/gantt-scale'

type WbsState = {
  activeProjectId: string | null
  collapsed: Set<string>
  showGantt: boolean
  splitRatio: number // grid width fraction (0.25–0.8)
  ganttScale: ScaleUnit
  setProject: (id: string | null) => void
  toggleCollapse: (id: string) => void
  collapseAll: (ids: string[]) => void
  expandAll: () => void
  setShowGantt: (show: boolean) => void
  setSplitRatio: (ratio: number) => void
  setScale: (unit: ScaleUnit) => void
}

export const useWbsStore = create<WbsState>((set) => ({
  activeProjectId: null,
  collapsed: new Set<string>(),
  showGantt: true,
  splitRatio: 0.55,
  ganttScale: 'day',
  setProject: (id) => set({ activeProjectId: id }),
  toggleCollapse: (id) =>
    set((state) => {
      const next = new Set(state.collapsed)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return { collapsed: next }
    }),
  collapseAll: (ids) => set({ collapsed: new Set(ids) }),
  expandAll: () => set({ collapsed: new Set<string>() }),
  setShowGantt: (showGantt) => set({ showGantt }),
  setSplitRatio: (ratio) =>
    set({ splitRatio: Math.min(0.8, Math.max(0.25, ratio)) }),
  setScale: (ganttScale) => set({ ganttScale }),
}))

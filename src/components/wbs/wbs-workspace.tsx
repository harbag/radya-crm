'use client'

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  GanttChartSquare,
  Plus,
  ChevronsDownUp,
  ChevronsUpDown,
  PanelRightClose,
  PanelRightOpen,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { GridSkeleton, QueryError } from '@/components/shared/query-states'
import { useCurrentUser } from '@/hooks/use-current-user'
import {
  useProjectList,
  useCreateProject,
  useWbsTaskList,
  useCreateWbsTask,
  useUpdateWbsTask,
  useBulkUpdateWbsTasks,
  useDeleteWbsTask,
  useUserList,
  type WbsTaskRow,
  type WbsTaskUpdate,
} from '@/lib/queries/wbs'
import {
  buildTree,
  assignWbsCodes,
  flattenVisible,
  getDescendantIds,
  findNode,
  canIndent as canIndentNode,
  canOutdent as canOutdentNode,
  type WbsNode,
} from '@/lib/wbs-tree'
import { computeRollups, validateWeights, rollupUpdatesForEdit } from '@/lib/wbs-rollup'
import { daysBetween } from '@/lib/gantt-scale'
import { useWbsStore } from '@/store/use-wbs-store'
import { useWbsDocStore } from '@/store/use-wbs-doc-store'
import WbsGrid, { type WbsGridHandlers } from './wbs-grid'
import WbsGantt from './wbs-gantt'
import WbsDocPanel from './editor/wbs-doc-panel'

function addDays(iso: string, n: number): string {
  const d = new Date(iso)
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

/** Keep duration / end_date consistent when dates or duration are edited. */
function withDerivedDates(
  row: WbsTaskRow,
  updates: Record<string, unknown>
): Record<string, unknown> {
  const next = { ...updates }
  const start =
    'start_date' in next ? (next.start_date as string | null) : row.start_date
  const end = 'end_date' in next ? (next.end_date as string | null) : row.end_date

  if (('start_date' in next || 'end_date' in next) && start && end) {
    next.duration_days = daysBetween(new Date(start), new Date(end)) + 1
  } else if ('duration_days' in next && start && next.duration_days != null) {
    next.end_date = addDays(start, (next.duration_days as number) - 1)
  }
  return next
}

export default function WbsWorkspace() {
  const { data: user } = useCurrentUser()
  const { data: users = [] } = useUserList()

  const activeProjectId = useWbsStore((s) => s.activeProjectId)
  const setProject = useWbsStore((s) => s.setProject)
  const collapsed = useWbsStore((s) => s.collapsed)
  const toggleCollapse = useWbsStore((s) => s.toggleCollapse)
  const collapseAll = useWbsStore((s) => s.collapseAll)
  const expandAll = useWbsStore((s) => s.expandAll)
  const showGantt = useWbsStore((s) => s.showGantt)
  const setShowGantt = useWbsStore((s) => s.setShowGantt)
  const splitRatio = useWbsStore((s) => s.splitRatio)
  const setSplitRatio = useWbsStore((s) => s.setSplitRatio)
  const ganttScale = useWbsStore((s) => s.ganttScale)
  const setScale = useWbsStore((s) => s.setScale)

  const openDoc = useWbsDocStore((s) => s.open)

  const projectsQuery = useProjectList()
  const createProject = useCreateProject()
  const tasksQuery = useWbsTaskList(activeProjectId)
  const createTask = useCreateWbsTask()
  const updateTask = useUpdateWbsTask()
  const bulkUpdate = useBulkUpdateWbsTasks()
  const deleteTask = useDeleteWbsTask()

  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Default to the first project once loaded.
  useEffect(() => {
    if (!activeProjectId && projectsQuery.data && projectsQuery.data.length > 0) {
      setProject(projectsQuery.data[0].id)
    }
  }, [activeProjectId, projectsQuery.data, setProject])

  const rows = useMemo(() => tasksQuery.data ?? [], [tasksQuery.data])
  const activeProject = projectsQuery.data?.find((p) => p.id === activeProjectId)

  // Build tree + derived data once per data change.
  const { roots, flatRows, rollups, weightWarnings } = useMemo(() => {
    const roots = buildTree(rows)
    assignWbsCodes(roots)
    const flatRows = flattenVisible(roots, collapsed)
    const rollups = computeRollups(roots)
    const warnings = new Set<string>()
    for (const v of validateWeights(roots)) {
      if (!v.valid && v.parentId) warnings.add(v.parentId)
    }
    return { roots, flatRows, rollups, weightWarnings: warnings }
  }, [rows, collapsed])

  // ── Mutations ───────────────────────────────────────────────────────────────

  const handleUpdate = useCallback(
    (id: string, rawUpdates: Record<string, unknown>) => {
      const row = rows.find((r) => r.id === id)
      if (!row) return
      const updates = withDerivedDates(row, rawUpdates)

      // Progress / weight edits cascade roll-ups to ancestors.
      if ('progress_percent' in updates || 'weight_percent' in updates) {
        const edits = rollupUpdatesForEdit(rows, {
          id,
          progress_percent:
            'progress_percent' in updates
              ? (updates.progress_percent as number)
              : undefined,
          weight_percent:
            'weight_percent' in updates
              ? (updates.weight_percent as number)
              : undefined,
        })
        // Merge any non-rollup fields into the leaf's own update.
        const leaf = edits.find((e) => e.id === id) as WbsTaskUpdate | undefined
        const rest = { ...updates }
        delete rest.progress_percent
        delete rest.weight_percent
        if (leaf) Object.assign(leaf, rest)
        bulkUpdate.mutate(edits as WbsTaskUpdate[])
        return
      }

      updateTask.mutate({ id, ...updates })
    },
    [rows, updateTask, bulkUpdate]
  )

  const handleIndent = useCallback(
    (id: string) => {
      const node = findNode(roots, id)
      if (!node) return
      const siblings = node.parent_id
        ? findNode(roots, node.parent_id)?.children ?? []
        : roots
      const idx = siblings.findIndex((s) => s.id === id)
      const prev = siblings[idx - 1]
      if (!canIndentNode(node, prev)) return

      const newDepth = prev.depth + 1
      const depthDelta = newDepth - node.depth
      const updates: WbsTaskUpdate[] = [
        {
          id,
          parent_id: prev.id,
          layer_depth: newDepth,
          order_index: prev.children.length,
        },
      ]
      for (const descId of getDescendantIds(node)) {
        const d = findNode(roots, descId)!
        updates.push({ id: descId, layer_depth: d.depth + depthDelta })
      }
      bulkUpdate.mutate(updates)
    },
    [roots, bulkUpdate]
  )

  const handleOutdent = useCallback(
    (id: string) => {
      const node = findNode(roots, id)
      if (!node || !canOutdentNode(node)) return
      const parent = node.parent_id ? findNode(roots, node.parent_id) : undefined
      if (!parent) return

      const grandParentId = parent.parent_id // may be null (becomes root)
      const newDepth = node.depth - 1
      const depthDelta = -1

      // Insert right after `parent` among the grandparent's children, then
      // renumber that sibling group sequentially.
      const newSiblings: WbsNode[] = grandParentId
        ? findNode(roots, grandParentId)?.children ?? []
        : roots
      const updates: WbsTaskUpdate[] = []
      let order = 0
      for (const sib of newSiblings) {
        if (sib.id === id) continue
        if (sib.order_index !== order) updates.push({ id: sib.id, order_index: order })
        order++
        if (sib.id === parent.id) {
          // place the outdented node immediately after its old parent
          updates.push({
            id,
            parent_id: grandParentId,
            layer_depth: newDepth,
            order_index: order,
          })
          order++
        }
      }
      for (const descId of getDescendantIds(node)) {
        const d = findNode(roots, descId)!
        updates.push({ id: descId, layer_depth: d.depth + depthDelta })
      }
      bulkUpdate.mutate(updates)
    },
    [roots, bulkUpdate]
  )

  const canIndentRow = useCallback(
    (id: string) => {
      const node = findNode(roots, id)
      if (!node) return false
      const siblings = node.parent_id
        ? findNode(roots, node.parent_id)?.children ?? []
        : roots
      const idx = siblings.findIndex((s) => s.id === id)
      return canIndentNode(node, siblings[idx - 1])
    },
    [roots]
  )

  const canOutdentRow = useCallback(
    (id: string) => canOutdentNode(findNode(roots, id)),
    [roots]
  )

  const handleAddChild = useCallback(
    (id: string) => {
      const node = findNode(roots, id)
      if (!node || !activeProjectId || node.depth >= 4) return
      createTask.mutate({
        project_id: activeProjectId,
        parent_id: id,
        layer_depth: node.depth + 1,
        order_index: node.children.length,
        created_by: user?.id ?? null,
      })
    },
    [roots, activeProjectId, createTask, user]
  )

  const handleAddSibling = useCallback(
    (id: string) => {
      const node = findNode(roots, id)
      if (!node || !activeProjectId) return
      const siblings = node.parent_id
        ? findNode(roots, node.parent_id)?.children ?? []
        : roots
      createTask.mutate({
        project_id: activeProjectId,
        parent_id: node.parent_id,
        layer_depth: node.depth,
        order_index: siblings.length,
        created_by: user?.id ?? null,
      })
    },
    [roots, activeProjectId, createTask, user]
  )

  const handleAddRoot = useCallback(() => {
    if (!activeProjectId) return
    createTask.mutate({
      project_id: activeProjectId,
      parent_id: null,
      layer_depth: 1,
      order_index: roots.length,
      created_by: user?.id ?? null,
    })
  }, [activeProjectId, roots.length, createTask, user])

  const handleDelete = useCallback(
    (id: string) => {
      const node = findNode(roots, id)
      if (!node) return
      deleteTask.mutate({ id, descendantIds: getDescendantIds(node) })
    },
    [roots, deleteTask]
  )

  const handleNewProject = useCallback(() => {
    const name = `New Project ${(projectsQuery.data?.length ?? 0) + 1}`
    createProject.mutate(
      { name, created_by: user?.id ?? null, owner_id: user?.id ?? null },
      { onSuccess: (p) => setProject(p.id) }
    )
  }, [createProject, projectsQuery.data, user, setProject])

  // ── Scroll sync between grid and Gantt panes ─────────────────────────────────

  const gridScrollRef = useRef<HTMLDivElement>(null)
  const ganttScrollRef = useRef<HTMLDivElement>(null)
  const syncing = useRef(false)

  const syncScroll = (source: 'grid' | 'gantt') => {
    if (syncing.current) {
      syncing.current = false
      return
    }
    const from = source === 'grid' ? gridScrollRef.current : ganttScrollRef.current
    const to = source === 'grid' ? ganttScrollRef.current : gridScrollRef.current
    if (from && to && to.scrollTop !== from.scrollTop) {
      syncing.current = true
      to.scrollTop = from.scrollTop
    }
  }

  // ── Split resize ─────────────────────────────────────────────────────────────

  const containerRef = useRef<HTMLDivElement>(null)
  const onDividerDown = (e: React.MouseEvent) => {
    e.preventDefault()
    const onMove = (ev: MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return
      setSplitRatio((ev.clientX - rect.left) / rect.width)
    }
    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  const gridHandlers: WbsGridHandlers = {
    rollups,
    weightWarnings,
    users,
    selectedId,
    onSelect: setSelectedId,
    onToggleCollapse: toggleCollapse,
    collapsed,
    onUpdate: handleUpdate,
    onIndent: handleIndent,
    onOutdent: handleOutdent,
    canIndent: canIndentRow,
    canOutdent: canOutdentRow,
    onAddChild: handleAddChild,
    onAddSibling: handleAddSibling,
    onDelete: handleDelete,
    onOpenDoc: openDoc,
  }

  // ── Render ─────────────────────────────────────────────────────────────────--

  const allNodeIds = useMemo(
    () => rows.filter((r) => rows.some((c) => c.parent_id === r.id)).map((r) => r.id),
    [rows]
  )

  if (projectsQuery.isLoading) return <GridSkeleton />
  if (projectsQuery.error)
    return (
      <QueryError
        message={(projectsQuery.error as Error).message}
        onRetry={() => projectsQuery.refetch()}
      />
    )

  const projects = projectsQuery.data ?? []

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Toolbar */}
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-zinc-200 px-4 py-2.5">
        <GanttChartSquare className="h-5 w-5 text-indigo-500" />
        <select
          value={activeProjectId ?? ''}
          onChange={(e) => setProject(e.target.value || null)}
          className="h-8 rounded-md border border-zinc-200 bg-background px-2 text-sm font-medium outline-none focus:ring-1 focus:ring-indigo-300"
        >
          {projects.length === 0 && <option value="">No projects</option>}
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <Button variant="outline" size="sm" onClick={handleNewProject}>
          <Plus className="h-3.5 w-3.5" /> Project
        </Button>

        <div className="mx-1 h-5 w-px bg-zinc-200" />

        <Button
          variant="outline"
          size="sm"
          onClick={handleAddRoot}
          disabled={!activeProjectId}
        >
          <Plus className="h-3.5 w-3.5" /> Phase
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => collapseAll(allNodeIds)}
          title="Collapse all"
        >
          <ChevronsDownUp className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={expandAll}
          title="Expand all"
        >
          <ChevronsUpDown className="h-3.5 w-3.5" />
        </Button>

        <div className="ml-auto flex items-center gap-2">
          {showGantt && (
            <div className="inline-flex items-center rounded-lg border border-zinc-200 bg-zinc-50 p-0.5">
              {(['day', 'week'] as const).map((u) => (
                <button
                  key={u}
                  onClick={() => setScale(u)}
                  className={cn(
                    'rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors',
                    ganttScale === u
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-700'
                  )}
                >
                  {u}
                </button>
              ))}
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowGantt(!showGantt)}
            title={showGantt ? 'Hide Gantt' : 'Show Gantt'}
          >
            {showGantt ? (
              <PanelRightClose className="h-4 w-4" />
            ) : (
              <PanelRightOpen className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Body */}
      {tasksQuery.isLoading ? (
        <GridSkeleton />
      ) : tasksQuery.error ? (
        <QueryError
          message={(tasksQuery.error as Error).message}
          onRetry={() => tasksQuery.refetch()}
        />
      ) : !activeProjectId ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
          <p className="text-sm font-medium text-zinc-600">No project selected</p>
          <Button size="sm" onClick={handleNewProject}>
            <Plus className="h-3.5 w-3.5" /> Create your first project
          </Button>
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
          <p className="text-sm font-medium text-zinc-600">
            No tasks in this project yet
          </p>
          <Button size="sm" onClick={handleAddRoot}>
            <Plus className="h-3.5 w-3.5" /> Add a phase
          </Button>
        </div>
      ) : (
        <div ref={containerRef} className="flex flex-1 overflow-hidden">
          {/* Grid pane */}
          <div
            ref={gridScrollRef}
            onScroll={() => syncScroll('grid')}
            className="overflow-auto"
            style={{ width: showGantt ? `${splitRatio * 100}%` : '100%' }}
          >
            <WbsGrid rows={flatRows} {...gridHandlers} />
          </div>

          {showGantt && (
            <>
              {/* Divider */}
              <div
                onMouseDown={onDividerDown}
                className="w-1 shrink-0 cursor-col-resize bg-zinc-200 hover:bg-indigo-300"
              />
              {/* Gantt pane */}
              <div
                ref={ganttScrollRef}
                onScroll={() => syncScroll('gantt')}
                className="flex-1 overflow-auto"
              >
                <WbsGantt
                  rows={flatRows}
                  rollups={rollups}
                  unit={ganttScale}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                  projectStart={activeProject?.start_date}
                  projectEnd={activeProject?.end_date}
                />
              </div>
            </>
          )}
        </div>
      )}

      <WbsDocPanel />
    </div>
  )
}

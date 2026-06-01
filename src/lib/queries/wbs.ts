import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { JSONContent } from '@tiptap/react'

// ── Types ─────────────────────────────────────────────────────────────────────

export type ProjectStatus = 'active' | 'on_hold' | 'completed' | 'archived'

export type ProjectRow = {
  id: string
  name: string
  description: string | null
  start_date: string | null
  end_date: string | null
  status: ProjectStatus
  owner_id: string | null
  created_by: string | null
  is_archived: boolean
  created_at: string
  updated_at: string
}

export type WbsTaskRow = {
  id: string
  project_id: string
  parent_id: string | null
  title: string
  wbs_code: string | null
  layer_depth: number // 1-4
  order_index: number
  start_date: string | null
  end_date: string | null
  duration_days: number | null
  progress_percent: number // 0-100
  weight_percent: number // 0-100
  document_content: JSONContent | null
  assignee_id: string | null
  created_by: string | null
  is_milestone: boolean
  created_at: string
  updated_at: string
}

export type WbsTaskInsert = Partial<
  Omit<WbsTaskRow, 'id' | 'created_at' | 'updated_at' | 'wbs_code'>
> & { project_id: string }

export type WbsTaskUpdate = Partial<Omit<WbsTaskRow, 'id' | 'created_at'>> & {
  id: string
}

export type UserOption = { id: string; name: string }

const PROJECT_KEY = 'projects'
const KEY = 'wbs_tasks'

// ── Users (for assignee dropdowns) ──────────────────────────────────────────--

export function useUserList() {
  return useQuery({
    queryKey: ['users', 'list'],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name')
        .eq('is_active', true)
        .order('full_name', { ascending: true })
      if (error) throw error
      return (data ?? []).map((u) => ({
        id: u.id as string,
        name: (u.full_name as string) ?? '',
      })) as UserOption[]
    },
  })
}

// ── Projects ──────────────────────────────────────────────────────────────────

export function useProjectList() {
  return useQuery({
    queryKey: [PROJECT_KEY, 'list'],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('is_archived', false)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as ProjectRow[]
    },
  })
}

export function useCreateProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: Partial<ProjectRow> & { name: string }) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('projects')
        .insert(input)
        .select()
        .single()
      if (error) throw error
      return data as ProjectRow
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PROJECT_KEY] })
    },
  })
}

// ── WBS tasks ───────────────────────────────────────────────────────────────--

export function useWbsTaskList(projectId: string | null) {
  return useQuery({
    queryKey: [KEY, 'list', projectId],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('wbs_tasks')
        .select('*')
        .eq('project_id', projectId)
        .order('order_index', { ascending: true })
      if (error) throw error
      return (data ?? []) as WbsTaskRow[]
    },
    enabled: !!projectId,
  })
}

export function useCreateWbsTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: WbsTaskInsert) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('wbs_tasks')
        .insert(input)
        .select()
        .single()
      if (error) throw error
      return data as WbsTaskRow
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] })
    },
  })
}

/** Optimistic single-row update — mirrors useUpdateTask in tasks.ts. */
export function useUpdateWbsTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: WbsTaskUpdate) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('wbs_tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as WbsTaskRow
    },
    onMutate: async ({ id, ...updates }) => {
      await queryClient.cancelQueries({ queryKey: [KEY] })
      const previousLists = queryClient.getQueriesData<WbsTaskRow[]>({
        queryKey: [KEY, 'list'],
      })
      queryClient.setQueriesData<WbsTaskRow[]>(
        { queryKey: [KEY, 'list'] },
        (old) =>
          old?.map((item) =>
            item.id === id ? ({ ...item, ...updates } as WbsTaskRow) : item
          ) ?? []
      )
      return { previousLists }
    },
    onError: (_err, _vars, context) => {
      context?.previousLists?.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data)
      })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] })
    },
  })
}

/**
 * Batch update — needed for roll-up cascades (a leaf edit touches many ancestors)
 * and reparent operations (indent/outdent renumber many siblings) in one logical
 * edit. Applies all changes optimistically, then persists row-by-row.
 */
export function useBulkUpdateWbsTasks() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (updates: WbsTaskUpdate[]) => {
      if (updates.length === 0) return
      const supabase = createClient()
      await Promise.all(
        updates.map(({ id, ...rest }) =>
          supabase
            .from('wbs_tasks')
            .update(rest)
            .eq('id', id)
            .then(({ error }) => {
              if (error) throw error
            })
        )
      )
    },
    onMutate: async (updates) => {
      await queryClient.cancelQueries({ queryKey: [KEY] })
      const previousLists = queryClient.getQueriesData<WbsTaskRow[]>({
        queryKey: [KEY, 'list'],
      })
      const byId = new Map(updates.map((u) => [u.id, u]))
      queryClient.setQueriesData<WbsTaskRow[]>(
        { queryKey: [KEY, 'list'] },
        (old) =>
          old?.map((item) => {
            const u = byId.get(item.id)
            return u ? ({ ...item, ...u } as WbsTaskRow) : item
          }) ?? []
      )
      return { previousLists }
    },
    onError: (_err, _vars, context) => {
      context?.previousLists?.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data)
      })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] })
    },
  })
}

/** Deletes a task; the DB ON DELETE CASCADE removes the whole subtree. */
export function useDeleteWbsTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id }: { id: string; descendantIds: string[] }) => {
      const supabase = createClient()
      const { error } = await supabase.from('wbs_tasks').delete().eq('id', id)
      if (error) throw error
    },
    onMutate: async ({ id, descendantIds }) => {
      await queryClient.cancelQueries({ queryKey: [KEY] })
      const previousLists = queryClient.getQueriesData<WbsTaskRow[]>({
        queryKey: [KEY, 'list'],
      })
      const removed = new Set([id, ...descendantIds])
      queryClient.setQueriesData<WbsTaskRow[]>(
        { queryKey: [KEY, 'list'] },
        (old) => old?.filter((item) => !removed.has(item.id)) ?? []
      )
      return { previousLists }
    },
    onError: (_err, _vars, context) => {
      context?.previousLists?.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data)
      })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] })
    },
  })
}

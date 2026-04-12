import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export type TaskRow = {
  id: string
  title: string
  description: string | null
  entity_type: 'lead' | 'deal' | 'contact' | 'company'
  entity_id: string
  assignee_id: string | null
  created_by: string | null
  due_date: string | null
  due_time: string | null
  priority: 'low' | 'medium' | 'high' | null
  status: 'open' | 'completed' | 'cancelled'
  completed_at: string | null
  type: 'call' | 'whatsapp' | 'meeting' | 'email' | 'follow_up' | 'other' | null
  created_at: string
  updated_at: string
}

export type TaskInsert = Omit<TaskRow, 'id' | 'created_at' | 'updated_at'>

export type TaskUpdate = Partial<Omit<TaskRow, 'id' | 'created_at'>> & {
  id: string
}

export type TaskFilters = {
  assignee_id?: string
  entity_type?: TaskRow['entity_type']
  entity_id?: string
  status?: TaskRow['status']
}

const KEY = 'tasks'

export function useTaskList(filters?: TaskFilters) {
  return useQuery({
    queryKey: [KEY, 'list', filters ?? null],
    queryFn: async () => {
      const supabase = createClient()
      let query = supabase
        .from('tasks')
        .select('*')
        .neq('status', 'cancelled')
        .order('due_date', { ascending: true, nullsFirst: false })
      if (filters?.assignee_id)
        query = query.eq('assignee_id', filters.assignee_id)
      if (filters?.entity_type)
        query = query.eq('entity_type', filters.entity_type)
      if (filters?.entity_id) query = query.eq('entity_id', filters.entity_id)
      if (filters?.status) query = query.eq('status', filters.status)
      const { data, error } = await query
      if (error) throw error
      return (data ?? []) as TaskRow[]
    },
  })
}

export function useTaskDetail(id: string) {
  return useQuery({
    queryKey: [KEY, 'detail', id],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return data as TaskRow
    },
    enabled: !!id,
  })
}

export function useCreateTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: TaskInsert) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('tasks')
        .insert(input)
        .select()
        .single()
      if (error) throw error
      return data as TaskRow
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] })
    },
  })
}

export function useUpdateTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: TaskUpdate) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as TaskRow
    },
    onMutate: async ({ id, ...updates }) => {
      await queryClient.cancelQueries({ queryKey: [KEY] })
      const previousList = queryClient.getQueriesData<TaskRow[]>({
        queryKey: [KEY, 'list'],
      })
      queryClient.setQueriesData<TaskRow[]>(
        { queryKey: [KEY, 'list'] },
        (old) =>
          old?.map((item) =>
            item.id === id ? ({ ...item, ...updates } as TaskRow) : item
          ) ?? []
      )
      const previousDetail = queryClient.getQueryData<TaskRow>([
        KEY,
        'detail',
        id,
      ])
      if (previousDetail) {
        queryClient.setQueryData<TaskRow>([KEY, 'detail', id], (old) =>
          old ? ({ ...old, ...updates } as TaskRow) : old
        )
      }
      return { previousList, previousDetail, id }
    },
    onError: (_err, { id }, context) => {
      context?.previousList?.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data)
      })
      if (context?.previousDetail) {
        queryClient.setQueryData([KEY, 'detail', id], context.previousDetail)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] })
    },
  })
}

// Sets status to 'cancelled' — tasks have no is_archived column
export function useArchiveTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient()
      const { error } = await supabase
        .from('tasks')
        .update({ status: 'cancelled' })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] })
    },
  })
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export type ActivityLogRow = {
  id: string
  entity_type: string
  entity_id: string
  actor_id: string | null
  action: string
  field_changed: string | null
  old_value: string | null
  new_value: string | null
  created_at: string
}

export type ActivityLogInsert = Omit<ActivityLogRow, 'id' | 'created_at'>

export type ActivityLogFilters = {
  entity_type?: string
  entity_id?: string
  actor_id?: string
}

const KEY = 'activity-log'

export function useActivityLog(filters?: ActivityLogFilters) {
  return useQuery({
    queryKey: [KEY, 'list', filters ?? null],
    queryFn: async () => {
      const supabase = createClient()
      let query = supabase
        .from('activity_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)
      if (filters?.entity_type)
        query = query.eq('entity_type', filters.entity_type)
      if (filters?.entity_id) query = query.eq('entity_id', filters.entity_id)
      if (filters?.actor_id) query = query.eq('actor_id', filters.actor_id)
      const { data, error } = await query
      if (error) throw error
      return (data ?? []) as ActivityLogRow[]
    },
  })
}

export function useLogActivity() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: ActivityLogInsert) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('activity_log')
        .insert(input)
        .select()
        .single()
      if (error) throw error
      return data as ActivityLogRow
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] })
    },
  })
}

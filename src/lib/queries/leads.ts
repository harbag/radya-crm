import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export type LeadRow = {
  id: string
  title: string
  status: 'new' | 'contacted' | 'qualified' | 'disqualified' | 'converted'
  contact_id: string | null
  company_id: string | null
  contact_name: string | null
  contact_phone: string | null
  contact_email: string | null
  lead_source: string | null
  estimated_value: number | null
  owner_id: string | null
  priority: 'low' | 'medium' | 'high' | null
  last_contacted_at: string | null
  next_follow_up_at: string | null
  custom_fields: Record<string, unknown>
  is_archived: boolean
  converted_at: string | null
  converted_deal_id: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export type LeadInsert = Omit<
  LeadRow,
  'id' | 'is_archived' | 'created_at' | 'updated_at' | 'custom_fields'
> & {
  custom_fields?: Record<string, unknown>
}

export type LeadUpdate = Partial<Omit<LeadRow, 'id' | 'created_at'>> & {
  id: string
}

export type LeadFilters = {
  owner_id?: string
  status?: LeadRow['status']
}

const KEY = 'leads'

export function useLeadList(filters?: LeadFilters) {
  return useQuery({
    queryKey: [KEY, 'list', filters ?? null],
    queryFn: async () => {
      const supabase = createClient()
      let query = supabase
        .from('leads')
        .select('*')
        .eq('is_archived', false)
        .order('created_at', { ascending: false })
      if (filters?.owner_id) query = query.eq('owner_id', filters.owner_id)
      if (filters?.status) query = query.eq('status', filters.status)
      const { data, error } = await query
      if (error) throw error
      return (data ?? []) as LeadRow[]
    },
  })
}

export function useLeadDetail(id: string) {
  return useQuery({
    queryKey: [KEY, 'detail', id],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return data as LeadRow
    },
    enabled: !!id,
  })
}

export function useCreateLead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: LeadInsert) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('leads')
        .insert(input)
        .select()
        .single()
      if (error) throw error
      return data as LeadRow
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] })
    },
  })
}

export function useUpdateLead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: LeadUpdate) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('leads')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as LeadRow
    },
    onMutate: async ({ id, ...updates }) => {
      await queryClient.cancelQueries({ queryKey: [KEY] })
      const previousList = queryClient.getQueriesData<LeadRow[]>({
        queryKey: [KEY, 'list'],
      })
      queryClient.setQueriesData<LeadRow[]>(
        { queryKey: [KEY, 'list'] },
        (old) =>
          old?.map((item) =>
            item.id === id ? ({ ...item, ...updates } as LeadRow) : item
          ) ?? []
      )
      const previousDetail = queryClient.getQueryData<LeadRow>([
        KEY,
        'detail',
        id,
      ])
      if (previousDetail) {
        queryClient.setQueryData<LeadRow>([KEY, 'detail', id], (old) =>
          old ? ({ ...old, ...updates } as LeadRow) : old
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

export function useArchiveLead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient()
      const { error } = await supabase
        .from('leads')
        .update({ is_archived: true })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] })
    },
  })
}

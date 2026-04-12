import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export type DealRow = {
  id: string
  title: string
  pipeline_id: string | null
  stage_id: string | null
  status: 'open' | 'won' | 'lost' | 'on_hold'
  value: number
  currency: string
  probability: number
  contact_id: string | null
  company_id: string | null
  owner_id: string | null
  expected_close_date: string | null
  actual_close_date: string | null
  lost_reason: string | null
  lead_source: string | null
  custom_fields: Record<string, unknown>
  stage_changed_at: string | null
  is_archived: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export type DealInsert = Omit<
  DealRow,
  'id' | 'is_archived' | 'created_at' | 'updated_at' | 'custom_fields'
> & {
  custom_fields?: Record<string, unknown>
}

export type DealUpdate = Partial<Omit<DealRow, 'id' | 'created_at'>> & {
  id: string
}

export type DealFilters = {
  owner_id?: string
  pipeline_id?: string
  status?: DealRow['status']
}

const KEY = 'deals'

export function useDealList(filters?: DealFilters) {
  return useQuery({
    queryKey: [KEY, 'list', filters ?? null],
    queryFn: async () => {
      const supabase = createClient()
      let query = supabase
        .from('deals')
        .select('*')
        .eq('is_archived', false)
        .order('created_at', { ascending: false })
      if (filters?.owner_id) query = query.eq('owner_id', filters.owner_id)
      if (filters?.pipeline_id)
        query = query.eq('pipeline_id', filters.pipeline_id)
      if (filters?.status) query = query.eq('status', filters.status)
      const { data, error } = await query
      if (error) throw error
      return (data ?? []) as DealRow[]
    },
  })
}

export function useDealDetail(id: string) {
  return useQuery({
    queryKey: [KEY, 'detail', id],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('deals')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return data as DealRow
    },
    enabled: !!id,
  })
}

export function useCreateDeal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: DealInsert) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('deals')
        .insert(input)
        .select()
        .single()
      if (error) throw error
      return data as DealRow
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] })
    },
  })
}

export function useUpdateDeal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: DealUpdate) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('deals')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as DealRow
    },
    onMutate: async ({ id, ...updates }) => {
      await queryClient.cancelQueries({ queryKey: [KEY] })
      const previousList = queryClient.getQueriesData<DealRow[]>({
        queryKey: [KEY, 'list'],
      })
      queryClient.setQueriesData<DealRow[]>(
        { queryKey: [KEY, 'list'] },
        (old) =>
          old?.map((item) =>
            item.id === id ? ({ ...item, ...updates } as DealRow) : item
          ) ?? []
      )
      const previousDetail = queryClient.getQueryData<DealRow>([
        KEY,
        'detail',
        id,
      ])
      if (previousDetail) {
        queryClient.setQueryData<DealRow>([KEY, 'detail', id], (old) =>
          old ? ({ ...old, ...updates } as DealRow) : old
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

export function useArchiveDeal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient()
      const { error } = await supabase
        .from('deals')
        .update({ is_archived: true })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] })
    },
  })
}

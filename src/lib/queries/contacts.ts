import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export type ContactRow = {
  id: string
  first_name: string
  last_name: string
  email: string | null
  phone_primary: string | null
  phone_secondary: string | null
  whatsapp: string | null
  job_title: string | null
  department: string | null
  company_id: string | null
  owner_id: string | null
  lead_source: string | null
  linkedin_url: string | null
  avatar_url: string | null
  custom_fields: Record<string, unknown>
  is_archived: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export type ContactInsert = Omit<
  ContactRow,
  'id' | 'is_archived' | 'created_at' | 'updated_at' | 'custom_fields'
> & {
  custom_fields?: Record<string, unknown>
}

export type ContactUpdate = Partial<Omit<ContactRow, 'id' | 'created_at'>> & {
  id: string
}

export type ContactFilters = {
  owner_id?: string
  company_id?: string
}

const KEY = 'contacts'

export function useContactList(filters?: ContactFilters) {
  return useQuery({
    queryKey: [KEY, 'list', filters ?? null],
    queryFn: async () => {
      const supabase = createClient()
      let query = supabase
        .from('contacts')
        .select('*')
        .eq('is_archived', false)
        .order('created_at', { ascending: false })
      if (filters?.owner_id) query = query.eq('owner_id', filters.owner_id)
      if (filters?.company_id) query = query.eq('company_id', filters.company_id)
      const { data, error } = await query
      if (error) throw error
      return (data ?? []) as ContactRow[]
    },
  })
}

export function useContactDetail(id: string) {
  return useQuery({
    queryKey: [KEY, 'detail', id],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return data as ContactRow
    },
    enabled: !!id,
  })
}

export function useCreateContact() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: ContactInsert) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('contacts')
        .insert(input)
        .select()
        .single()
      if (error) throw error
      return data as ContactRow
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] })
    },
  })
}

export function useUpdateContact() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: ContactUpdate) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('contacts')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as ContactRow
    },
    onMutate: async ({ id, ...updates }) => {
      await queryClient.cancelQueries({ queryKey: [KEY] })
      const previousList = queryClient.getQueriesData<ContactRow[]>({
        queryKey: [KEY, 'list'],
      })
      queryClient.setQueriesData<ContactRow[]>(
        { queryKey: [KEY, 'list'] },
        (old) =>
          old?.map((item) =>
            item.id === id ? ({ ...item, ...updates } as ContactRow) : item
          ) ?? []
      )
      const previousDetail = queryClient.getQueryData<ContactRow>([
        KEY,
        'detail',
        id,
      ])
      if (previousDetail) {
        queryClient.setQueryData<ContactRow>([KEY, 'detail', id], (old) =>
          old ? ({ ...old, ...updates } as ContactRow) : old
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

export function useArchiveContact() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient()
      const { error } = await supabase
        .from('contacts')
        .update({ is_archived: true })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] })
    },
  })
}

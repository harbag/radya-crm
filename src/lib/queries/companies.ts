import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export type CompanyRow = {
  id: string
  name: string
  industry: string | null
  company_size: '1-10' | '11-50' | '51-200' | '201-500' | '500+' | null
  website: string | null
  phone: string | null
  email_domain: string | null
  address_city: string | null
  address_province: string | null
  address_country: string
  logo_url: string | null
  owner_id: string | null
  annual_revenue: number | null
  custom_fields: Record<string, unknown>
  is_archived: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export type CompanyInsert = Omit<
  CompanyRow,
  'id' | 'is_archived' | 'created_at' | 'updated_at' | 'custom_fields'
> & {
  custom_fields?: Record<string, unknown>
}

export type CompanyUpdate = Partial<Omit<CompanyRow, 'id' | 'created_at'>> & {
  id: string
}

export type CompanyFilters = {
  owner_id?: string
  industry?: string
}

const KEY = 'companies'

export function useCompanyList(filters?: CompanyFilters) {
  return useQuery({
    queryKey: [KEY, 'list', filters ?? null],
    queryFn: async () => {
      const supabase = createClient()
      let query = supabase
        .from('companies')
        .select('*')
        .eq('is_archived', false)
        .order('name', { ascending: true })
      if (filters?.owner_id) query = query.eq('owner_id', filters.owner_id)
      if (filters?.industry) query = query.eq('industry', filters.industry)
      const { data, error } = await query
      if (error) throw error
      return (data ?? []) as CompanyRow[]
    },
  })
}

export function useCompanyDetail(id: string) {
  return useQuery({
    queryKey: [KEY, 'detail', id],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return data as CompanyRow
    },
    enabled: !!id,
  })
}

export function useCreateCompany() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CompanyInsert) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('companies')
        .insert(input)
        .select()
        .single()
      if (error) throw error
      return data as CompanyRow
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] })
    },
  })
}

export function useUpdateCompany() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: CompanyUpdate) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('companies')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as CompanyRow
    },
    onMutate: async ({ id, ...updates }) => {
      await queryClient.cancelQueries({ queryKey: [KEY] })
      const previousList = queryClient.getQueriesData<CompanyRow[]>({
        queryKey: [KEY, 'list'],
      })
      queryClient.setQueriesData<CompanyRow[]>(
        { queryKey: [KEY, 'list'] },
        (old) =>
          old?.map((item) =>
            item.id === id ? ({ ...item, ...updates } as CompanyRow) : item
          ) ?? []
      )
      const previousDetail = queryClient.getQueryData<CompanyRow>([
        KEY,
        'detail',
        id,
      ])
      if (previousDetail) {
        queryClient.setQueryData<CompanyRow>([KEY, 'detail', id], (old) =>
          old ? ({ ...old, ...updates } as CompanyRow) : old
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

export function useArchiveCompany() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient()
      const { error } = await supabase
        .from('companies')
        .update({ is_archived: true })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] })
    },
  })
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export type NoteRow = {
  id: string
  body: string
  entity_type: 'lead' | 'deal' | 'contact' | 'company'
  entity_id: string
  author_id: string | null
  mentioned_user_ids: string[]
  is_pinned: boolean
  created_at: string
  updated_at: string
}

export type NoteInsert = Omit<NoteRow, 'id' | 'created_at' | 'updated_at'>

export type NoteUpdate = Partial<Omit<NoteRow, 'id' | 'created_at'>> & {
  id: string
}

export type NoteFilters = {
  entity_type?: NoteRow['entity_type']
  entity_id?: string
  author_id?: string
}

const KEY = 'notes'

export function useNoteList(filters?: NoteFilters) {
  return useQuery({
    queryKey: [KEY, 'list', filters ?? null],
    queryFn: async () => {
      const supabase = createClient()
      let query = supabase
        .from('notes')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
      if (filters?.entity_type)
        query = query.eq('entity_type', filters.entity_type)
      if (filters?.entity_id) query = query.eq('entity_id', filters.entity_id)
      if (filters?.author_id) query = query.eq('author_id', filters.author_id)
      const { data, error } = await query
      if (error) throw error
      return (data ?? []) as NoteRow[]
    },
  })
}

export function useNoteDetail(id: string) {
  return useQuery({
    queryKey: [KEY, 'detail', id],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return data as NoteRow
    },
    enabled: !!id,
  })
}

export function useCreateNote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: NoteInsert) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('notes')
        .insert(input)
        .select()
        .single()
      if (error) throw error
      return data as NoteRow
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] })
    },
  })
}

export function useUpdateNote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: NoteUpdate) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('notes')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as NoteRow
    },
    onMutate: async ({ id, ...updates }) => {
      await queryClient.cancelQueries({ queryKey: [KEY] })
      const previousList = queryClient.getQueriesData<NoteRow[]>({
        queryKey: [KEY, 'list'],
      })
      queryClient.setQueriesData<NoteRow[]>(
        { queryKey: [KEY, 'list'] },
        (old) =>
          old?.map((item) =>
            item.id === id ? ({ ...item, ...updates } as NoteRow) : item
          ) ?? []
      )
      const previousDetail = queryClient.getQueryData<NoteRow>([
        KEY,
        'detail',
        id,
      ])
      if (previousDetail) {
        queryClient.setQueryData<NoteRow>([KEY, 'detail', id], (old) =>
          old ? ({ ...old, ...updates } as NoteRow) : old
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

export function useDeleteNote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient()
      const { error } = await supabase.from('notes').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] })
    },
  })
}

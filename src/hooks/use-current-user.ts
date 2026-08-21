import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { UserProfile } from '@/lib/types'

export function useCurrentUser() {
  return useQuery<UserProfile | null>({
    queryKey: ['current-user'],
    queryFn: async () => {
      const supabase = createClient()

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError) throw sessionError
      if (!session?.user) return null

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (error) throw error

      const row = data as {
        id: string
        full_name: string
        email: string
        phone: string | null
        role: 'admin' | 'sales' | 'viewer'
        avatar_url: string | null
        is_active: boolean
        last_login_at: string | null
        created_at: string
        updated_at: string
      }

      return {
        id: row.id,
        fullName: row.full_name,
        email: row.email,
        phone: row.phone ?? undefined,
        role: row.role,
        avatarUrl: row.avatar_url ?? undefined,
        isActive: row.is_active,
        lastLoginAt: row.last_login_at ?? undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      } satisfies UserProfile
    },
  })
}

export type UpdateCurrentUserInput = {
  fullName: string
  phone: string | null
}

export function useUpdateCurrentUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ fullName, phone }: UpdateCurrentUserInput) => {
      const supabase = createClient()
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError) throw userError
      if (!user) throw new Error('You must be signed in to update your profile.')

      const { data, error } = await supabase
        .from('users')
        .update({
          full_name: fullName.trim(),
          phone: phone?.trim() || null,
        })
        .eq('id', user.id)
        .select('*')
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-user'] })
    },
  })
}

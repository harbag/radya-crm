import { useQuery } from '@tanstack/react-query'
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

      if (sessionError || !session?.user) return null

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (error) return null

      const row = data as {
        id: string
        full_name: string
        email: string
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

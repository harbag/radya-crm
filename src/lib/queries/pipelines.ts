import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export type PipelineStageRow = {
  id: string
  pipeline_id: string
  name: string
  order_index: number
  default_probability: number
  color: string | null
  is_won_stage: boolean
  is_lost_stage: boolean
  created_at: string
  updated_at: string
}

export type PipelineRow = {
  id: string
  name: string
  is_default: boolean
  created_at: string
  updated_at: string
  pipeline_stages?: PipelineStageRow[]
}

export function usePipelines() {
  return useQuery({
    queryKey: ['pipelines', 'list'],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('pipelines')
        .select('*, pipeline_stages(*)')
        .order('name', { ascending: true })
      if (error) throw error
      return (data ?? []) as PipelineRow[]
    },
  })
}

export function useStages(pipelineId: string) {
  return useQuery({
    queryKey: ['pipelines', 'stages', pipelineId],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('pipeline_stages')
        .select('*')
        .eq('pipeline_id', pipelineId)
        .order('order_index', { ascending: true })
      if (error) throw error
      return (data ?? []) as PipelineStageRow[]
    },
    enabled: !!pipelineId,
  })
}

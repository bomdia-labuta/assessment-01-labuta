// src/lib/supabase/responses.ts
import { createClient } from '@supabase/supabase-js'
import type { AssessmentResponse, Narrative, Tipologia, NodeSlug } from '@/lib/assessment/types'

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function createResponse(): Promise<string> {
  const supabase = serviceClient()
  const { data, error } = await supabase
    .from('assessment_responses')
    .insert({})
    .select('id')
    .single()
  if (error || !data) throw new Error(`Failed to create response: ${error?.message}`)
  return data.id as string
}

export async function updateResponse(
  id: string,
  patch: Partial<Omit<AssessmentResponse, 'id' | 'created_at'>>
): Promise<void> {
  const supabase = serviceClient()
  const { error } = await supabase
    .from('assessment_responses')
    .update(patch)
    .eq('id', id)
  if (error) throw new Error(`Failed to update response: ${error.message}`)
}

export async function getResponse(id: string): Promise<AssessmentResponse | null> {
  const supabase = serviceClient()
  const { data, error } = await supabase
    .from('assessment_responses')
    .select('*')
    .eq('id', id)
    .single()
  if (error || !data) return null
  return data as AssessmentResponse
}

export async function getNarrativesForNode(nodeSlug: NodeSlug): Promise<Narrative[]> {
  const supabase = serviceClient()
  const { data, error } = await supabase
    .from('assessment_narratives')
    .select('*')
    .eq('node_slug', nodeSlug)
  if (error || !data) return []
  return data as Narrative[]
}

export async function getTipologiaBySignature(
  topNodes: NodeSlug[]
): Promise<Tipologia | null> {
  const supabase = serviceClient()
  const { data, error } = await supabase
    .from('assessment_typologies')
    .select('*')
  if (error || !data) return null

  // Score de compatibilidade: quantidade de nós em common com assinatura
  const scored = (data as Tipologia[]).map(t => ({
    tipologia: t,
    score: t.assinatura_nos.filter(n => topNodes.includes(n)).length,
  }))
  const best = scored.sort((a, b) => b.score - a.score)[0]
  return best && best.score > 0 ? best.tipologia : null
}

export async function getAllTipologias(): Promise<Tipologia[]> {
  const supabase = serviceClient()
  const { data, error } = await supabase.from('assessment_typologies').select('*')
  if (error || !data) return []
  return data as Tipologia[]
}

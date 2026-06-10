// src/lib/assessment/types.ts
export type NodeSlug =
  | 'tomada-de-decisao'
  | 'papeis-e-responsabilidades'
  | 'comunicacao'
  | 'poder-e-influencia'
  | 'conflitos-entre-areas'
  | 'conversas-dificeis'
  | 'mudanca-e-adaptacao'
  | 'trabalho-invisivel'
  | 'ritos-e-reunioes'

export type ScaleResponse = 'sim' | 'um_pouco' | 'nao'

export const SCALE_WEIGHTS: Record<ScaleResponse, number> = {
  sim: 1.0,
  um_pouco: 0.5,
  nao: 0.0,
}

export interface AssessmentNode {
  slug: NodeSlug
  label: string
  color: string
}

export interface Narrative {
  id: string
  node_slug: NodeSlug
  seed_text: string
  variations: string[] | null
  tags: string[]
}

export interface NodeState {
  response: ScaleResponse | null
  selectedNarrativeIds: string[]
  freeInput: string
  tags: string[]
}

export interface SessionState {
  responseId: string | null
  nodeOrder: NodeSlug[]
  nodes: Partial<Record<NodeSlug, NodeState>>
}

export interface Tipologia {
  id: string
  nome: string
  descricao: string | null
  assinatura_nos: NodeSlug[]
  pontos_atencao: string[]
  cta: string | null
}

export interface AssessmentResponse {
  id: string
  created_at: string
  completed_at: string | null
  name: string | null
  email: string | null
  marketing_consent: boolean
  node_scores: Partial<Record<NodeSlug, number>> | null
  node_tags: Partial<Record<NodeSlug, string[]>> | null
  selected_narratives: Partial<Record<NodeSlug, string[]>> | null
  free_inputs: Partial<Record<NodeSlug, string>> | null
  tipologia_id: string | null
  leitura_sistemica: string | null
  graph_image_url: string | null
  result_shared: boolean
  result_email_sent: boolean
}

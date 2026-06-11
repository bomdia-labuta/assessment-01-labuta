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
  | 'sobrecarga'

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

export interface CustomNarrative {
  id: string           // UUID local para keying
  text: string
  response: ScaleResponse | null
  tags: string[]
}

export interface NodeState {
  // Resposta por micro-narrativa do pool
  narrativeResponses: Record<string, ScaleResponse>
  // Micro-narrativas adicionadas pelo usuário
  customNarratives: CustomNarrative[]
  // IDs do pool sorteados para esta sessão (garantia de consistência ao voltar)
  shownNarrativeIds: string[]
  // Tags ativadas (confirmadas com sim ou um_pouco) — denormalizado para o grafo
  activatedTags: string[]
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

export interface ActivatedNode {
  nodeId: string
  label: string
  intensity: number
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

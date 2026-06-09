export type NarrativeResponse = 'ressoa' | 'nao_tanto'

export interface Narrative {
  id: string
  text: string
}

export interface AssessmentNode {
  id: string
  label: string
  narratives: Narrative[]
  // Posição no SVG (grafo fixo)
  x: number
  y: number
}

// { nodeId: { narrativeId: 'ressoa' | 'nao_tanto' } }
export type ResponseMap = Record<string, Record<string, NarrativeResponse>>

export interface ActivatedNode {
  nodeId: string
  label: string
  intensity: number // 0-1: proporção de respostas 'ressoa'
}

export interface TipologiaVariable {
  name: string
  direction: 'up' | 'down' | 'neutral'
}

export interface TipologiaExperiment {
  title: string
  description: string
}

export interface TipologiaFeedbackLoop {
  positive: string   // reforço positivo (↑)
  risk: string       // risco de amplificação (−)
  observe: string    // o que observar (↺)
}

export type TipologiaCategory = 'vetorial' | 'sinalizacao' | 'comunicacao'

export interface Tipologia {
  id: string
  name: string
  category: TipologiaCategory
  categoryLabel: string
  icon: string
  shortDescription: string
  effects: string[]
  feedbackLoop: TipologiaFeedbackLoop
  variables: TipologiaVariable[]
  experiments: TipologiaExperiment[]
}

export interface AssessmentResult {
  id: string
  createdAt: string
  name: string
  email: string
  activatedNodes: ActivatedNode[]
  narrativeText: string
  tipologiasIds: string[]
}

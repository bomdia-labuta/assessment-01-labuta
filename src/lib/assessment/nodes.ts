// src/lib/assessment/nodes.ts
import type { AssessmentNode, NodeSlug } from './types'

export const ASSESSMENT_NODES: AssessmentNode[] = [
  { slug: 'tomada-de-decisao',         label: 'Tomada de decisão',         color: '#3355dd' },
  { slug: 'papeis-e-responsabilidades', label: 'Papéis e responsabilidades', color: '#DF4B19' },
  { slug: 'comunicacao',               label: 'Comunicação',               color: '#FAE063' },
  { slug: 'poder-e-influencia',         label: 'Poder e influência',         color: '#e07820' },
  { slug: 'conflitos-entre-areas',      label: 'Conflitos entre áreas',      color: '#9966dd' },
  { slug: 'conversas-dificeis',         label: 'Conversas difíceis',         color: '#f08898' },
  { slug: 'mudanca-e-adaptacao',        label: 'Mudança e adaptação',        color: '#2dd4bf' },
  { slug: 'trabalho-invisivel',         label: 'Trabalho invisível',         color: '#4ade80' },
  { slug: 'ritos-e-reunioes',           label: 'Ritos e reuniões',           color: '#38bdf8' },
]

export const NODE_MAP: Record<NodeSlug, AssessmentNode> = Object.fromEntries(
  ASSESSMENT_NODES.map(n => [n.slug, n])
) as Record<NodeSlug, AssessmentNode>

export const ALL_SLUGS: NodeSlug[] = ASSESSMENT_NODES.map(n => n.slug)

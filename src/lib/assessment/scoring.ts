// src/lib/assessment/scoring.ts
import { SCALE_WEIGHTS } from './types'
import type { NodeSlug, NodeState, SessionState } from './types'

// Score bruto: soma dos pesos das micro-narrativas confirmadas
// Nós com mais micro-narrativas ativas ficam com score mais alto (intencional)
export function calculateNodeScore(state: NodeState): number {
  let sum = 0
  for (const resp of Object.values(state.narrativeResponses)) {
    sum += SCALE_WEIGHTS[resp]
  }
  for (const cn of state.customNarratives) {
    if (cn.response) sum += SCALE_WEIGHTS[cn.response]
  }
  return sum
}

export function calculateNodeScores(
  session: SessionState
): Partial<Record<NodeSlug, number>> {
  const scores: Partial<Record<NodeSlug, number>> = {}
  for (const [slug, state] of Object.entries(session.nodes)) {
    if (state) {
      scores[slug as NodeSlug] = calculateNodeScore(state)
    }
  }
  return scores
}

export function getTopNodes(
  scores: Partial<Record<NodeSlug, number>>,
  n = 3
): NodeSlug[] {
  return (Object.entries(scores) as [NodeSlug, number][])
    .sort(([, a], [, b]) => b - a)
    .slice(0, n)
    .map(([slug]) => slug)
}

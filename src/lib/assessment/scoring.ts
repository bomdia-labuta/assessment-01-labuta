// src/lib/assessment/scoring.ts
import { SCALE_WEIGHTS } from './types'
import type { NodeSlug, ScaleResponse, SessionState } from './types'

const TAG_BOOST = 0.05

export function calculateNodeScore(
  response: ScaleResponse | null,
  tags: string[]
): number {
  if (!response) return 0.0
  const base = SCALE_WEIGHTS[response]
  const boost = tags.length > 0 ? TAG_BOOST : 0
  return Math.min(1.0, base + boost)
}

export function calculateNodeScores(
  session: SessionState
): Partial<Record<NodeSlug, number>> {
  const scores: Partial<Record<NodeSlug, number>> = {}
  for (const [slug, state] of Object.entries(session.nodes)) {
    if (state) {
      scores[slug as NodeSlug] = calculateNodeScore(state.response, state.tags)
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

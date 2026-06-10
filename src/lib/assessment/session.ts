// src/lib/assessment/session.ts
import type { NodeSlug, ScaleResponse, SessionState } from './types'
import { ALL_SLUGS } from './nodes'

export const SESSION_KEY = 'labuta_assessment_v2'

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j]!, copy[i]!]
  }
  return copy
}

export function initSession(): SessionState {
  return { responseId: null, nodeOrder: shuffle(ALL_SLUGS), nodes: {} }
}

export function loadSession(): SessionState {
  if (typeof window === 'undefined') return initSession()
  const raw = localStorage.getItem(SESSION_KEY)
  if (!raw) return initSession()
  try {
    return JSON.parse(raw) as SessionState
  } catch {
    return initSession()
  }
}

export function saveSession(session: SessionState): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function clearSession(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(SESSION_KEY)
}

export function updateNodeState(
  session: SessionState,
  slug: NodeSlug,
  updates: Partial<{ response: ScaleResponse; freeInput: string; tags: string[]; selectedNarrativeIds: string[] }>
): SessionState {
  const updated: SessionState = {
    ...session,
    nodes: {
      ...session.nodes,
      [slug]: {
        response: null,
        selectedNarrativeIds: [],
        freeInput: '',
        tags: [],
        ...(session.nodes[slug] ?? {}),
        ...updates,
      },
    },
  }
  saveSession(updated)
  return updated
}

export function getNodeStep(session: SessionState, slug: NodeSlug): number {
  return session.nodeOrder.indexOf(slug)
}

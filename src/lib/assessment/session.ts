// src/lib/assessment/session.ts
import type { NodeSlug, ScaleResponse, SessionState, NodeState, Narrative, CustomNarrative } from './types'
import { ALL_SLUGS } from './nodes'

export const SESSION_KEY = 'labuta_assessment_v3'

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j]!, copy[i]!]
  }
  return copy
}

function makeEmptyNodeState(): NodeState {
  return {
    narrativeResponses: {},
    customNarratives: [],
    shownNarrativeIds: [],
    activatedTags: [],
  }
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

function patchNode(
  session: SessionState,
  slug: NodeSlug,
  patch: Partial<NodeState>
): SessionState {
  const updated: SessionState = {
    ...session,
    nodes: {
      ...session.nodes,
      [slug]: {
        ...makeEmptyNodeState(),
        ...(session.nodes[slug] ?? {}),
        ...patch,
      },
    },
  }
  saveSession(updated)
  return updated
}

// Define quais narrativas do pool serão mostradas neste nó para esta sessão
export function initShownNarratives(
  session: SessionState,
  slug: NodeSlug,
  allNarratives: Narrative[],
  count = 4
): SessionState {
  const existing = session.nodes[slug]?.shownNarrativeIds
  if (existing?.length) return session  // já sorteado antes
  const sampled = shuffle(allNarratives).slice(0, count).map(n => n.id)
  return patchNode(session, slug, { shownNarrativeIds: sampled })
}

// Resposta a uma micro-narrativa do pool
export function updateNarrativeResponse(
  session: SessionState,
  slug: NodeSlug,
  narrativeId: string,
  response: ScaleResponse,
  narrativePool: Narrative[]  // para recalcular activatedTags
): SessionState {
  const current = session.nodes[slug] ?? makeEmptyNodeState()
  const narrativeResponses = { ...current.narrativeResponses, [narrativeId]: response }

  // Recalcula tags ativadas (sim ou um_pouco) a partir do pool e custom
  const activatedTags = computeActivatedTags(
    narrativeResponses,
    current.customNarratives,
    narrativePool
  )

  return patchNode(session, slug, { narrativeResponses, activatedTags })
}

// Adiciona micro-narrativa customizada
export function addCustomNarrative(
  session: SessionState,
  slug: NodeSlug,
  text: string
): { session: SessionState; id: string } {
  const current = session.nodes[slug] ?? makeEmptyNodeState()
  const id = crypto.randomUUID()
  const newEntry: CustomNarrative = { id, text, response: null, tags: [] }
  const updated = patchNode(session, slug, {
    customNarratives: [...current.customNarratives, newEntry],
  })
  return { session: updated, id }
}

// Resposta a uma micro-narrativa customizada
export function updateCustomNarrativeResponse(
  session: SessionState,
  slug: NodeSlug,
  customId: string,
  response: ScaleResponse,
  narrativePool: Narrative[]
): SessionState {
  const current = session.nodes[slug] ?? makeEmptyNodeState()
  const customNarratives = current.customNarratives.map(cn =>
    cn.id === customId ? { ...cn, response } : cn
  )
  const activatedTags = computeActivatedTags(
    current.narrativeResponses,
    customNarratives,
    narrativePool
  )
  return patchNode(session, slug, { customNarratives, activatedTags })
}

// Atualiza tags de uma micro-narrativa customizada (após classificação AI)
export function updateCustomNarrativeTags(
  session: SessionState,
  slug: NodeSlug,
  customId: string,
  tags: string[],
  narrativePool: Narrative[]
): SessionState {
  const current = session.nodes[slug] ?? makeEmptyNodeState()
  const customNarratives = current.customNarratives.map(cn =>
    cn.id === customId ? { ...cn, tags } : cn
  )
  const activatedTags = computeActivatedTags(
    current.narrativeResponses,
    customNarratives,
    narrativePool
  )
  return patchNode(session, slug, { customNarratives, activatedTags })
}

function computeActivatedTags(
  narrativeResponses: Record<string, ScaleResponse>,
  customNarratives: CustomNarrative[],
  narrativePool: Narrative[]
): string[] {
  const tags = new Set<string>()
  for (const n of narrativePool) {
    const resp = narrativeResponses[n.id]
    if (resp && resp !== 'nao') {
      n.tags.forEach(t => tags.add(t))
    }
  }
  for (const cn of customNarratives) {
    if (cn.response && cn.response !== 'nao') {
      cn.tags.forEach(t => tags.add(t))
    }
  }
  return Array.from(tags)
}

export function getNodeStep(session: SessionState, slug: NodeSlug): number {
  return session.nodeOrder.indexOf(slug)
}

// Compatibilidade legacy — mantém até refatoração dos testes
export function updateNodeState(
  session: SessionState,
  slug: NodeSlug,
  updates: Partial<{ response: ScaleResponse; freeInput: string; tags: string[]; selectedNarrativeIds: string[] }>
): SessionState {
  const current = session.nodes[slug] ?? makeEmptyNodeState()
  // Mapeia response antiga para narrativeResponses de fallback
  const narrativeResponses =
    updates.response !== undefined
      ? { ...current.narrativeResponses, __legacy__: updates.response }
      : current.narrativeResponses
  return patchNode(session, slug, {
    narrativeResponses,
    activatedTags: updates.tags ?? current.activatedTags,
  })
}

// __tests__/lib/assessment/scoring.test.ts
import { calculateNodeScore, calculateNodeScores, getTopNodes } from '@/lib/assessment/scoring'
import type { SessionState, NodeState } from '@/lib/assessment/types'

function makeNodeState(overrides: Partial<NodeState> = {}): NodeState {
  return {
    narrativeResponses: {},
    customNarratives: [],
    shownNarrativeIds: [],
    activatedTags: [],
    ...overrides,
  }
}

describe('calculateNodeScore', () => {
  it('retorna 0 para nó sem respostas', () => {
    expect(calculateNodeScore(makeNodeState())).toBe(0)
  })

  it('retorna 1.0 para uma narrativa sim', () => {
    const state = makeNodeState({ narrativeResponses: { 'abc': 'sim' } })
    expect(calculateNodeScore(state)).toBe(1.0)
  })

  it('retorna 0.5 para uma narrativa um_pouco', () => {
    const state = makeNodeState({ narrativeResponses: { 'abc': 'um_pouco' } })
    expect(calculateNodeScore(state)).toBe(0.5)
  })

  it('retorna 0.0 para uma narrativa nao', () => {
    const state = makeNodeState({ narrativeResponses: { 'abc': 'nao' } })
    expect(calculateNodeScore(state)).toBe(0.0)
  })

  it('soma múltiplas narrativas', () => {
    const state = makeNodeState({
      narrativeResponses: { 'a': 'sim', 'b': 'um_pouco', 'c': 'nao' },
    })
    expect(calculateNodeScore(state)).toBe(1.5)
  })

  it('inclui score de narrativas customizadas', () => {
    const state = makeNodeState({
      narrativeResponses: { 'a': 'sim' },
      customNarratives: [{ id: 'c1', text: 'x', response: 'sim', tags: [] }],
    })
    expect(calculateNodeScore(state)).toBe(2.0)
  })

  it('nó com mais narrativas tem score maior (correto por design)', () => {
    const small = makeNodeState({ narrativeResponses: { 'a': 'sim' } })
    const large = makeNodeState({ narrativeResponses: { 'a': 'sim', 'b': 'sim', 'c': 'sim' } })
    expect(calculateNodeScore(large)).toBeGreaterThan(calculateNodeScore(small))
  })
})

describe('getTopNodes', () => {
  const scores = {
    'comunicacao': 2.0,
    'tomada-de-decisao': 3.0,
    'trabalho-invisivel': 1.0,
    'ritos-e-reunioes': 0.5,
  } as Parameters<typeof getTopNodes>[0]

  it('retorna os top 3 por score decrescente', () => {
    const top = getTopNodes(scores, 3)
    expect(top[0]).toBe('tomada-de-decisao')
    expect(top[1]).toBe('comunicacao')
    expect(top[2]).toBe('trabalho-invisivel')
  })

  it('respeita o parâmetro n', () => {
    expect(getTopNodes(scores, 2)).toHaveLength(2)
  })
})

// __tests__/lib/assessment/session.test.ts
import { initSession, updateNarrativeResponse, addCustomNarrative, getNodeStep } from '@/lib/assessment/session'
import type { Narrative } from '@/lib/assessment/types'

const fakeNarratives: Narrative[] = [
  { id: 'n1', node_slug: 'comunicacao', seed_text: 'Teste 1', variations: null, tags: ['tag1', 'tag2'] },
  { id: 'n2', node_slug: 'comunicacao', seed_text: 'Teste 2', variations: null, tags: ['tag2', 'tag3'] },
]

describe('initSession', () => {
  it('cria sessão com 10 nós na ordem', () => {
    const s = initSession()
    expect(s.nodeOrder).toHaveLength(10)
    expect(s.nodes).toEqual({})
    expect(s.responseId).toBeNull()
  })

  it('randomiza a ordem a cada chamada', () => {
    const a = initSession().nodeOrder
    const b = initSession().nodeOrder
    // Com 10 nós a chance de ordem idêntica é 1/10! ≈ 0
    expect(a.join('')).not.toBe(b.join(''))
  })
})

describe('updateNarrativeResponse', () => {
  it('adiciona resposta a uma narrativa do nó', () => {
    const s = initSession()
    const updated = updateNarrativeResponse(s, 'comunicacao', 'n1', 'sim', fakeNarratives)
    expect(updated.nodes['comunicacao']?.narrativeResponses['n1']).toBe('sim')
  })

  it('computa activatedTags das narrativas confirmadas', () => {
    const s = initSession()
    const updated = updateNarrativeResponse(s, 'comunicacao', 'n1', 'sim', fakeNarratives)
    // n1 tem tags tag1, tag2 — deve estar ativado
    expect(updated.nodes['comunicacao']?.activatedTags).toContain('tag1')
    expect(updated.nodes['comunicacao']?.activatedTags).toContain('tag2')
  })

  it('não ativa tags de narrativas com resposta nao', () => {
    const s = initSession()
    const updated = updateNarrativeResponse(s, 'comunicacao', 'n1', 'nao', fakeNarratives)
    expect(updated.nodes['comunicacao']?.activatedTags).toHaveLength(0)
  })

  it('preserva respostas anteriores ao atualizar', () => {
    let s = initSession()
    s = updateNarrativeResponse(s, 'comunicacao', 'n1', 'sim', fakeNarratives)
    s = updateNarrativeResponse(s, 'comunicacao', 'n2', 'um_pouco', fakeNarratives)
    expect(s.nodes['comunicacao']?.narrativeResponses['n1']).toBe('sim')
    expect(s.nodes['comunicacao']?.narrativeResponses['n2']).toBe('um_pouco')
  })
})

describe('addCustomNarrative', () => {
  it('adiciona micro-narrativa customizada ao nó', () => {
    const s = initSession()
    const { session: updated } = addCustomNarrative(s, 'comunicacao', 'Texto da situação')
    const customs = updated.nodes['comunicacao']?.customNarratives
    expect(customs).toHaveLength(1)
    expect(customs![0]!.text).toBe('Texto da situação')
    expect(customs![0]!.response).toBeNull()
  })

  it('retorna o id da nova narrativa', () => {
    const s = initSession()
    const { id } = addCustomNarrative(s, 'comunicacao', 'Texto')
    expect(typeof id).toBe('string')
    expect(id.length).toBeGreaterThan(0)
  })
})

describe('getNodeStep', () => {
  it('retorna o índice do nó na ordem da sessão', () => {
    const s = initSession()
    const slug = s.nodeOrder[3]!
    expect(getNodeStep(s, slug)).toBe(3)
  })

  it('retorna -1 para slug inválido', () => {
    const s = initSession()
    expect(getNodeStep(s, 'nao-existe' as never)).toBe(-1)
  })
})

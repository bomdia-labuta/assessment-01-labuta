// __tests__/lib/assessment/session.test.ts
import { initSession, updateNodeState, getNodeStep } from '@/lib/assessment/session'

describe('initSession', () => {
  it('cria sessão com 9 nós na ordem', () => {
    const s = initSession()
    expect(s.nodeOrder).toHaveLength(9)
    expect(s.nodes).toEqual({})
    expect(s.responseId).toBeNull()
  })

  it('randomiza a ordem a cada chamada', () => {
    const a = initSession().nodeOrder
    const b = initSession().nodeOrder
    // Com 9 nós a chance de ordem idêntica é 1/9! ≈ 0
    expect(a.join('')).not.toBe(b.join(''))
  })
})

describe('updateNodeState', () => {
  it('adiciona resposta a um nó', () => {
    const s = initSession()
    const updated = updateNodeState(s, 'comunicacao', { response: 'sim' })
    expect(updated.nodes['comunicacao']?.response).toBe('sim')
  })

  it('preserva estado anterior ao atualizar', () => {
    let s = initSession()
    s = updateNodeState(s, 'comunicacao', { response: 'sim', freeInput: 'texto' })
    s = updateNodeState(s, 'comunicacao', { tags: ['tag1'] })
    expect(s.nodes['comunicacao']?.response).toBe('sim')
    expect(s.nodes['comunicacao']?.freeInput).toBe('texto')
    expect(s.nodes['comunicacao']?.tags).toEqual(['tag1'])
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

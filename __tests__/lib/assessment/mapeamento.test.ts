import { mapToTipologias } from '@/lib/assessment/mapeamento'
import type { ActivatedNode } from '@/lib/assessment/types'

describe('mapToTipologias', () => {
  it('sugere transparecer quando decisao e papeis têm alta intensidade', () => {
    const nodes: ActivatedNode[] = [
      { nodeId: 'decisao', label: 'Decisão', intensity: 0.9 },
      { nodeId: 'papeis', label: 'Papéis', intensity: 0.8 },
    ]
    const result = mapToTipologias(nodes)
    expect(result).toContain('transparecer')
    expect(result).toContain('condicionar')
  })

  it('sugere pesquisar quando aprendizado tem alta intensidade', () => {
    const nodes: ActivatedNode[] = [
      { nodeId: 'aprendizado', label: 'Aprendizado', intensity: 0.9 },
    ]
    const result = mapToTipologias(nodes)
    expect(result).toContain('pesquisar')
  })

  it('sugere monitorar quando ritmos tem alta intensidade', () => {
    const nodes: ActivatedNode[] = [
      { nodeId: 'ritmos', label: 'Ritmos', intensity: 0.8 },
    ]
    const result = mapToTipologias(nodes)
    expect(result).toContain('monitorar')
  })

  it('sugere estabilizar quando multiplos nós têm alta intensidade', () => {
    const nodes: ActivatedNode[] = [
      { nodeId: 'decisao', label: 'Decisão', intensity: 0.9 },
      { nodeId: 'papeis', label: 'Papéis', intensity: 0.8 },
      { nodeId: 'comunicacao', label: 'Comunicação', intensity: 0.9 },
    ]
    const result = mapToTipologias(nodes)
    expect(result).toContain('estabilizar')
  })

  it('retorna no máximo 3 tipologias', () => {
    const nodes: ActivatedNode[] = [
      { nodeId: 'decisao', label: 'Decisão', intensity: 1 },
      { nodeId: 'papeis', label: 'Papéis', intensity: 1 },
      { nodeId: 'comunicacao', label: 'Comunicação', intensity: 1 },
      { nodeId: 'aprendizado', label: 'Aprendizado', intensity: 1 },
      { nodeId: 'ritmos', label: 'Ritmos', intensity: 1 },
    ]
    const result = mapToTipologias(nodes)
    expect(result.length).toBeLessThanOrEqual(3)
  })

  it('retorna array vazio quando não há nós ativados', () => {
    expect(mapToTipologias([])).toEqual([])
  })
})

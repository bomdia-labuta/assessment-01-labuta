// __tests__/lib/assessment/nodes.test.ts
import { ASSESSMENT_NODES, NODE_MAP, ALL_SLUGS } from '@/lib/assessment/nodes'

describe('ASSESSMENT_NODES', () => {
  it('contém exatamente 10 nós', () => {
    expect(ASSESSMENT_NODES).toHaveLength(10)
  })

  it('todos os nós têm slug, label e cor', () => {
    for (const node of ASSESSMENT_NODES) {
      expect(node.slug).toBeTruthy()
      expect(node.label).toBeTruthy()
      expect(node.color).toMatch(/^#[0-9a-f]{6}$/i)
    }
  })

  it('NODE_MAP indexa todos os nós por slug', () => {
    expect(Object.keys(NODE_MAP)).toHaveLength(10)
    expect(NODE_MAP['comunicacao'].label).toBe('Comunicação')
    expect(NODE_MAP['sobrecarga'].label).toBe('Sobrecarga')
  })

  it('ALL_SLUGS tem 10 slugs', () => {
    expect(ALL_SLUGS).toHaveLength(10)
  })
})

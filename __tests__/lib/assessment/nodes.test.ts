// __tests__/lib/assessment/nodes.test.ts
import { ASSESSMENT_NODES, NODE_MAP, ALL_SLUGS } from '@/lib/assessment/nodes'

describe('ASSESSMENT_NODES', () => {
  it('contém exatamente 9 nós', () => {
    expect(ASSESSMENT_NODES).toHaveLength(9)
  })

  it('todos os nós têm slug, label e cor', () => {
    for (const node of ASSESSMENT_NODES) {
      expect(node.slug).toBeTruthy()
      expect(node.label).toBeTruthy()
      expect(node.color).toMatch(/^#[0-9a-f]{6}$/i)
    }
  })

  it('NODE_MAP indexa todos os nós por slug', () => {
    expect(Object.keys(NODE_MAP)).toHaveLength(9)
    expect(NODE_MAP['comunicacao'].label).toBe('Comunicação')
  })

  it('ALL_SLUGS tem 9 slugs', () => {
    expect(ALL_SLUGS).toHaveLength(9)
  })
})

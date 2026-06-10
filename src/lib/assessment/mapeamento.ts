// src/lib/assessment/mapeamento.ts
import type { ActivatedNode } from './types'

const INTENSITY_THRESHOLD = 0.7

// Maps combinations of high-intensity nodes to tipologia suggestions
const TIPOLOGIA_RULES: Array<{
  name: string
  trigger: (nodeIds: string[], count: number) => boolean
}> = [
  {
    name: 'estabilizar',
    trigger: (_nodeIds, count) => count >= 3,
  },
  {
    name: 'transparecer',
    trigger: (nodeIds) =>
      nodeIds.includes('decisao') || nodeIds.includes('papeis'),
  },
  {
    name: 'condicionar',
    trigger: (nodeIds) =>
      nodeIds.includes('papeis') || nodeIds.includes('decisao'),
  },
  {
    name: 'pesquisar',
    trigger: (nodeIds) => nodeIds.includes('aprendizado'),
  },
  {
    name: 'monitorar',
    trigger: (nodeIds) => nodeIds.includes('ritmos'),
  },
]

export function mapToTipologias(nodes: ActivatedNode[]): string[] {
  if (nodes.length === 0) return []

  const highIntensityNodes = nodes.filter(
    (n) => n.intensity >= INTENSITY_THRESHOLD
  )

  if (highIntensityNodes.length === 0) return []

  const nodeIds = highIntensityNodes.map((n) => n.nodeId)
  const count = highIntensityNodes.length

  const result: string[] = []

  for (const rule of TIPOLOGIA_RULES) {
    if (result.length >= 3) break
    if (rule.trigger(nodeIds, count) && !result.includes(rule.name)) {
      result.push(rule.name)
    }
  }

  return result
}

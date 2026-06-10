// src/lib/ai/leitura.ts
import Anthropic from '@anthropic-ai/sdk'
import type { NodeSlug } from '@/lib/assessment/types'
import { NODE_MAP } from '@/lib/assessment/nodes'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface LeituraInput {
  nodeScores: Partial<Record<NodeSlug, number>>
  nodeTags: Partial<Record<NodeSlug, string[]>>
  tipologiaNome: string | null
}

export function buildLeituraPrompt(input: LeituraInput): string {
  const lines = (Object.entries(input.nodeScores) as [NodeSlug, number][])
    .sort(([, a], [, b]) => b - a)
    .map(([slug, score]) => {
      const node = NODE_MAP[slug]
      const tags = input.nodeTags[slug] ?? []
      const tagsStr = tags.length ? ` (tags: ${tags.join(', ')})` : ''
      return `- ${node.label}: ${(score * 100).toFixed(0)}%${tagsStr}`
    })
    .join('\n')

  return `Padrão de ativação:\n${lines}\n\nTipologia sugerida: ${input.tipologiaNome ?? 'não identificada'}\n\nGere a leitura sistêmica.`
}

export async function* streamLeitura(input: LeituraInput): AsyncIterable<string> {
  const systemPrompt = process.env.LABUTA_ORG_DESIGNER_PROMPT ?? 'Você é um designer organizacional da Labuta Labs. Gere uma leitura sistêmica direta, sem jargão, em primeira pessoa do plural, baseada no padrão de ativação do assessment.'

  const stream = await client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 800,
    system: systemPrompt,
    messages: [{ role: 'user', content: buildLeituraPrompt(input) }],
  })

  for await (const event of stream) {
    if (
      event.type === 'content_block_delta' &&
      event.delta.type === 'text_delta'
    ) {
      yield event.delta.text
    }
  }
}

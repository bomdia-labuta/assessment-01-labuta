// src/lib/ai/tagging.ts
import Anthropic from '@anthropic-ai/sdk'
import { ALL_SLUGS } from '@/lib/assessment/nodes'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const VALID_TAGS = ALL_SLUGS.map(s => s.replace(/-/g, '_'))

export async function classifyTags(text: string): Promise<string[]> {
  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 100,
    messages: [
      {
        role: 'user',
        content: `Classifique o texto abaixo com 1 a 3 tags do vocabulário: ${VALID_TAGS.join(', ')}.
Responda APENAS com as tags separadas por vírgula, sem explicação.
Texto: "${text}"`,
      },
    ],
  })

  const raw = message.content[0]?.type === 'text' ? message.content[0].text : ''
  return raw
    .split(',')
    .map((t: string) => t.trim())
    .filter((t: string) => VALID_TAGS.includes(t))
}

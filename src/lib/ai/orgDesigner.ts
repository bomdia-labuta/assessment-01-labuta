import Anthropic from '@anthropic-ai/sdk'
import type { ActivatedNode } from '../assessment/types'
import { FLORA_SYSTEM_PROMPT } from './flora-prompt'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface OrgDesignerInput {
  activatedNodes: ActivatedNode[]
  suggestedTipologias: string[]
}

export async function generateLeituraSistemica(input: OrgDesignerInput): Promise<string> {
  const systemPrompt = process.env.LABUTA_ORG_DESIGNER_PROMPT ?? FLORA_SYSTEM_PROMPT

  const highNodes = input.activatedNodes.filter(n => n.intensity >= 0.6)
  const allNodes = input.activatedNodes

  const userMessage = `
Padrão de ativação do assessment:

Pontos de alavancagem com forte ressonância (≥60%):
${highNodes.map(n => `- ${n.label} (${(n.intensity * 100).toFixed(0)}% de ressonância)`).join('\n') || '(nenhum com ressonância forte)'}

Todos os pontos explorados:
${allNodes.map(n => `- ${n.label}: ${(n.intensity * 100).toFixed(0)}%`).join('\n')}

Tipologias sugeridas para este padrão: ${input.suggestedTipologias.join(', ')}

Gere a leitura sistêmica e os parágrafos de contexto para cada tipologia conforme o formato definido.
  `.trim()

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1500,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  })

  const textBlock = message.content.find(block => block.type === 'text')
  return textBlock?.type === 'text' ? textBlock.text : ''
}

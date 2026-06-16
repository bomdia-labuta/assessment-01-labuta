import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { buildReportSystemPrompt, buildReportUserPrompt } from './report-prompt'
import type { ContextoRelatorio } from './report-prompt'
import { reportSchema } from './report-schema'
import type { RelatorioEstruturado } from './report-schema'

export type { ContextoRelatorio }
export type { RelatorioEstruturado }

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Gera o relatório sistêmico como objeto estruturado (structured outputs garantem o shape).
export async function generateReport(contexto: ContextoRelatorio): Promise<RelatorioEstruturado | null> {
  const message = await client.messages.parse({
    model: 'claude-sonnet-4-6',
    max_tokens: 4000,
    system: buildReportSystemPrompt(),
    messages: [{ role: 'user', content: buildReportUserPrompt(contexto) }],
    output_config: { format: zodOutputFormat(reportSchema) },
  })

  return message.parsed_output
}

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { calculateNodeScores } from '@/lib/assessment/scoring'
import { getAllNarratives } from '@/lib/supabase/responses'
import { generateReport } from '@/lib/ai/leitura'
import { NODE_MAP } from '@/lib/assessment/nodes'
import type { SessionState, NodeSlug } from '@/lib/assessment/types'
import type { NarrativaAtivada, ContextoRelatorio } from '@/lib/ai/report-prompt'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const SubmitSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  marketing_consent: z.boolean().default(false),
  session: z.object({
    responseId: z.string().nullable(),
    nodeOrder: z.array(z.string()),
    nodes: z.record(z.any()),
  }),
})

async function buildContextoRelatorio(session: SessionState): Promise<ContextoRelatorio> {
  // Fetch all narratives once (batch, not per-node)
  const allNarratives = await getAllNarratives()
  const narrativeMap = Object.fromEntries(allNarratives.map(n => [n.id, n]))

  const narrativasAtivadas: NarrativaAtivada[] = []
  const narrativasCustomizadas: ContextoRelatorio['narrativasCustomizadas'] = []
  const nosRevisados: ContextoRelatorio['nosRevisados'] = []

  for (const [slug, state] of Object.entries(session.nodes) as [NodeSlug, SessionState['nodes'][NodeSlug]][]) {
    if (!state) continue
    const nodeLabel = NODE_MAP[slug]?.label ?? slug
    nosRevisados.push({ slug, label: nodeLabel })

    // Narrativas do pool
    for (const [narrativeId, ressonancia] of Object.entries(state.narrativeResponses)) {
      if (ressonancia === 'nao') continue
      const narrative = narrativeMap[narrativeId]
      if (!narrative) continue
      narrativasAtivadas.push({
        nodeSlug: slug,
        nodeLabel,
        texto: narrative.seed_text,
        ressonancia: ressonancia as 'sim' | 'um_pouco',
        tags: narrative.tags ?? [],
      })
    }

    // Narrativas customizadas pelo usuário
    for (const cn of state.customNarratives ?? []) {
      if (!cn.response || cn.response === 'nao') continue
      narrativasCustomizadas.push({
        nodeLabel,
        texto: cn.text,
        ressonancia: cn.response as 'sim' | 'um_pouco',
      })
    }
  }

  return { narrativasAtivadas, narrativasCustomizadas, nosRevisados }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = SubmitSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    const { name, email, marketing_consent, session } = parsed.data
    const typedSession = session as SessionState

    // 1. Preparar dados da sessão
    const nodeScores = calculateNodeScores(typedSession)
    const nodeTags = Object.fromEntries(
      Object.entries(typedSession.nodes).map(([slug, state]) => [slug, state?.activatedTags ?? []])
    )
    const freeInputs = Object.fromEntries(
      Object.entries(typedSession.nodes).map(([slug, state]) => {
        const customs = state?.customNarratives?.map(cn => cn.text).join(' | ') ?? ''
        return [slug, customs]
      })
    )
    const selectedNarratives = Object.fromEntries(
      Object.entries(typedSession.nodes).map(([slug, state]) => [
        slug,
        Object.keys(state?.narrativeResponses ?? {}),
      ])
    )

    // 2. Gerar leitura sistêmica (objeto estruturado) com contexto completo das narrativas
    const contexto = await buildContextoRelatorio(typedSession)
    const relatorio = await generateReport(contexto).catch(err => {
      console.error('[submit] Erro ao gerar leitura:', err)
      return null
    })
    // Persistido como JSON string na coluna leitura_sistemica (text)
    const leituraSistemica = relatorio ? JSON.stringify(relatorio) : null

    // 3. Salvar tudo junto
    const { data, error } = await supabase
      .from('assessment_responses')
      .insert({
        name,
        email,
        marketing_consent,
        node_scores: nodeScores,
        node_tags: nodeTags,
        selected_narratives: selectedNarratives,
        free_inputs: freeInputs,
        leitura_sistemica: leituraSistemica,
        completed_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Erro ao salvar resultado' }, { status: 500 })
    }

    const resultId = data.id as string
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'

    // 4. Email em background (não bloqueia)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    import('@/lib/email/resend').then((mod: any) => mod.sendResultEmail({
      to: email, name, resultId,
      resultUrl: `${baseUrl}/assessment/result/${resultId}`,
    })).catch((err: unknown) => console.error('Email error (non-blocking):', err))

    return NextResponse.json({ id: resultId })
  } catch (err) {
    console.error('Submit error:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

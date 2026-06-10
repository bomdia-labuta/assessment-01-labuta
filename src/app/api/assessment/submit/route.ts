import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { calculateNodeScores, getTopNodes } from '@/lib/assessment/scoring'
import { getTipologiaBySignature } from '@/lib/supabase/responses'
import type { SessionState } from '@/lib/assessment/types'

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
  graphImage: z.string().nullable().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = SubmitSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    const { name, email, marketing_consent, session, graphImage } = parsed.data
    const typedSession = session as SessionState

    // 1. Calcular scores
    const nodeScores = calculateNodeScores(typedSession)
    const topNodes = getTopNodes(nodeScores, 3)
    const nodeTags = Object.fromEntries(
      Object.entries(typedSession.nodes).map(([slug, state]) => [slug, state?.tags ?? []])
    )
    const freeInputs = Object.fromEntries(
      Object.entries(typedSession.nodes).map(([slug, state]) => [slug, state?.freeInput ?? ''])
    )
    const selectedNarratives = Object.fromEntries(
      Object.entries(typedSession.nodes).map(([slug, state]) => [slug, state?.selectedNarrativeIds ?? []])
    )

    // 2. Buscar tipologia
    const tipologia = await getTipologiaBySignature(topNodes)

    // 3. Salvar imagem do grafo no Storage (se fornecida)
    let graphImageUrl: string | null = null
    if (graphImage) {
      const base64Data = graphImage.replace(/^data:image\/\w+;base64,/, '')
      const buffer = Buffer.from(base64Data, 'base64')
      const filename = `graphs/${Date.now()}-${Math.random().toString(36).slice(2)}.png`
      const { error: uploadError } = await supabase.storage
        .from('assessment-graphs')
        .upload(filename, buffer, { contentType: 'image/png', upsert: false })
      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage.from('assessment-graphs').getPublicUrl(filename)
        graphImageUrl = publicUrl
      }
    }

    // 4. Salvar response completa
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
        tipologia_id: tipologia?.id ?? null,
        graph_image_url: graphImageUrl,
        completed_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Erro ao salvar resultado' }, { status: 500 })
    }

    const resultId = data.id as string
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'

    // 5. Enviar email em background (import dinâmico para não quebrar se resend.ts não existir ainda)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    import('@/lib/email/resend' as any)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then(({ sendResultEmail }: any) => sendResultEmail({
        to: email,
        name,
        resultId,
        graphImageUrl,
        resultUrl: `${baseUrl}/assessment/result/${resultId}`,
      }))
      .catch((err: unknown) => console.error('Email error (non-blocking):', err))

    return NextResponse.json({ id: resultId })
  } catch (err) {
    console.error('Submit error:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

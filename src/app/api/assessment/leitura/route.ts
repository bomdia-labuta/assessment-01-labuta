// src/app/api/assessment/leitura/route.ts
import { NextRequest } from 'next/server'
import { getResponse, getAllTipologias, updateResponse } from '@/lib/supabase/responses'
import { streamLeitura } from '@/lib/ai/leitura'
import type { NodeSlug } from '@/lib/assessment/types'

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return new Response('Missing id', { status: 400 })

  const response = await getResponse(id)
  if (!response) return new Response('Not found', { status: 404 })

  // Se leitura já foi gerada e salva, retornar direto
  if (response.leitura_sistemica) {
    return new Response(response.leitura_sistemica, {
      headers: { 'Content-Type': 'text/plain' },
    })
  }

  let tipologiaNome: string | null = null
  if (response.tipologia_id) {
    const tipologias = await getAllTipologias()
    tipologiaNome = tipologias.find(t => t.id === response.tipologia_id)?.nome ?? null
  }

  const encoder = new TextEncoder()
  let fullText = ''

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of streamLeitura({
          nodeScores: (response.node_scores ?? {}) as Partial<Record<NodeSlug, number>>,
          nodeTags: (response.node_tags ?? {}) as Partial<Record<NodeSlug, string[]>>,
          tipologiaNome,
        })) {
          fullText += chunk
          controller.enqueue(encoder.encode(chunk))
        }

        // Salvar leitura gerada no Supabase
        await updateResponse(id, { leitura_sistemica: fullText }).catch(() => {})

        controller.close()
      } catch (err) {
        controller.error(err)
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
    },
  })
}

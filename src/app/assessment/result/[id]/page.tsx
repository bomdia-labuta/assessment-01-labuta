import { notFound } from 'next/navigation'
import { getResponse, getAllTipologias } from '@/lib/supabase/responses'
import { ForceGraph } from '@/components/grafo/ForceGraph'
import { LeituraSistemica } from '@/components/resultado/LeituraSistemica'
import { TipologiaTabs } from '@/components/resultado/TipologiaTabs'
import { initSession } from '@/lib/assessment/session'
import type { SessionState, NodeSlug, AssessmentResponse } from '@/lib/assessment/types'

function responseToSession(response: AssessmentResponse): SessionState {
  const nodes: SessionState['nodes'] = {}
  const scores = response.node_scores ?? {}
  const tags = response.node_tags ?? {}
  const narratives = response.selected_narratives ?? {}

  for (const slug of Object.keys(scores) as NodeSlug[]) {
    const score = scores[slug] ?? 0
    const shownIds = narratives[slug] ?? []
    const narrativeResponses: Record<string, 'sim' | 'um_pouco' | 'nao'> = {}

    // Distribui o score real entre as narrativas para preservar o % correto no grafo
    // score = n_sim * 1.0 + n_half * 0.5
    const nSim = Math.min(Math.floor(score), shownIds.length)
    const remainder = score - nSim
    const nHalf = remainder >= 0.45 && nSim < shownIds.length ? 1 : 0
    shownIds.forEach((id, idx) => {
      narrativeResponses[id] = idx < nSim ? 'sim' : idx < nSim + nHalf ? 'um_pouco' : 'nao'
    })

    nodes[slug] = {
      narrativeResponses,
      customNarratives: [],
      shownNarrativeIds: shownIds,
      activatedTags: tags[slug] ?? [],
    }
  }

  return { responseId: response.id, nodeOrder: Object.keys(scores) as NodeSlug[], nodes }
}

export default async function ResultPage({ params }: { params: { id: string } }) {
  const response = await getResponse(params.id)
  if (!response) notFound()

  const allTipologias = await getAllTipologias()
  const recommended = allTipologias.find(t => t.id === response.tipologia_id) ?? null
  const session = responseToSession(response)
  const firstName = response.name?.split(' ')[0] ?? null

  return (
    <main className="min-h-screen" style={{ background: '#0e0e12' }}>
      <div className="max-w-3xl mx-auto px-4 py-12 flex flex-col gap-8">
        {/* Header */}
        <div className="text-center">
          <p className="text-purple-400 font-bold text-xs tracking-widest uppercase mb-2">LABUTA LABS</p>
          <h1 className="text-2xl font-bold text-white">
            {firstName ? `Seu mapa, ${firstName}` : 'Seu mapa organizacional'}
          </h1>
        </div>

        {/* Grafo */}
        <ForceGraph session={session} activeSlug={null} width={640} height={420} />

        {/* Leitura sistêmica (streaming) */}
        <LeituraSistemica
          responseId={response.id}
          initialText={response.leitura_sistemica}
        />

        {/* Tipologias */}
        {allTipologias.length > 0 ? (
          <TipologiaTabs tipologias={allTipologias} recommended={recommended} />
        ) : (
          <div className="rounded-2xl border border-white/5 p-4 text-center text-gray-600 text-xs">
            Tipologias não disponíveis — seed não aplicada ou erro de conexão
          </div>
        )}

        {/* CTA */}
        <div className="rounded-2xl border border-white/10 p-8 text-center flex flex-col gap-4 bg-white/5">
          <h2 className="text-xl font-bold text-white">Isso ressou com algo que você está vivendo?</h2>
          <p className="text-gray-400 text-sm max-w-md mx-auto leading-relaxed">
            A Labuta trabalha com organizações explorando esses pontos de alavancagem
            através de experimentos estruturados — não consultoria tradicional.
          </p>
          <a
            href="https://labuta.com/contato"
            className="bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-purple-500 transition-colors text-sm inline-block"
          >
            Conversar com a Labuta →
          </a>
        </div>
      </div>
    </main>
  )
}

'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ForceGraph } from '@/components/grafo/ForceGraph'
import { NarrativaPanel } from '@/components/grafo/NarrativaPanel'
import {
  loadSession,
  initShownNarratives,
  updateNarrativeResponse,
  addCustomNarrative,
  updateCustomNarrativeResponse,
  updateCustomNarrativeTags,
} from '@/lib/assessment/session'
import { NODE_MAP } from '@/lib/assessment/nodes'
import type { SessionState, ScaleResponse, NodeSlug, Narrative } from '@/lib/assessment/types'

export default function StepPage() {
  const router = useRouter()
  const { step } = useParams<{ step: string }>()
  const stepIndex = parseInt(step, 10)

  const [session, setSession] = useState<SessionState | null>(null)
  const [allNarratives, setAllNarratives] = useState<Narrative[]>([])

  // Carregar sessão
  useEffect(() => {
    const s = loadSession()
    if (!s.nodeOrder?.length) { router.replace('/assessment'); return }
    setSession(s)
  }, [router])

  const currentSlug = session?.nodeOrder[stepIndex] ?? null
  const currentNode = currentSlug ? NODE_MAP[currentSlug] : null

  // Buscar narrativas do nó atual e sortear quais mostrar
  useEffect(() => {
    if (!currentSlug || !session) return
    fetch(`/api/assessment/narratives?slug=${currentSlug}`)
      .then(r => r.json())
      .then((data: Narrative[]) => {
        setAllNarratives(data)
        // Inicializar narrativas sorteadas na sessão (idempotente se já sorteadas)
        setSession(prev => {
          if (!prev) return prev
          return initShownNarratives(prev, currentSlug, data, 4)
        })
      })
      .catch(() => setAllNarratives([]))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSlug])

  // Narrativas mostradas = subset sorteado na inicialização
  const shownNarratives = (() => {
    if (!session || !currentSlug) return []
    const shownIds = session.nodes[currentSlug]?.shownNarrativeIds ?? []
    if (shownIds.length) return allNarratives.filter(n => shownIds.includes(n.id))
    return allNarratives.slice(0, 4)
  })()

  const handleNarrativeResponse = useCallback((slug: NodeSlug, narrativeId: string, response: ScaleResponse) => {
    setSession(prev => {
      if (!prev) return prev
      return updateNarrativeResponse(prev, slug, narrativeId, response, allNarratives)
    })
  }, [allNarratives])

  const handleAddCustomNarrative = useCallback((slug: NodeSlug, text: string) => {
    setSession(prev => {
      if (!prev) return prev
      const { session: updated, id } = addCustomNarrative(prev, slug, text)
      // Classificar tags da micro-narrativa customizada (non-blocking)
      fetch('/api/assessment/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
        .then(r => r.json())
        .then(({ tags }: { tags: string[] }) => {
          setSession(s => s ? updateCustomNarrativeTags(s, slug, id, tags, allNarratives) : s)
        })
        .catch(() => { /* non-blocking */ })
      return updated
    })
  }, [allNarratives])

  const handleCustomNarrativeResponse = useCallback((slug: NodeSlug, customId: string, response: ScaleResponse) => {
    setSession(prev => {
      if (!prev) return prev
      return updateCustomNarrativeResponse(prev, slug, customId, response, allNarratives)
    })
  }, [allNarratives])

  const currentState = session && currentSlug ? session.nodes[currentSlug] : undefined
  const isLast = session ? stepIndex === session.nodeOrder.length - 1 : false

  // Nó "visitado" quando tem ao menos uma resposta (pool ou custom)
  const nodeIsAnswered = currentState && (
    Object.keys(currentState.narrativeResponses).length > 0 ||
    currentState.customNarratives.length > 0
  )

  const handleNext = () => {
    if (isLast) {
      router.push('/assessment/gate')
    } else {
      router.push(`/assessment/${stepIndex + 1}`)
    }
  }

  if (!session || !currentNode) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: '#0e0e12' }}>
        <div className="text-gray-500 text-sm">Carregando…</div>
      </main>
    )
  }

  return (
    <main className="min-h-screen" style={{ background: '#0e0e12' }}>
      {/* Barra de progresso */}
      <div className="flex justify-center gap-2 pt-6 pb-4">
        {session.nodeOrder.map((slug, i) => {
          const state = session.nodes[slug]
          const done = state && (
            Object.keys(state.narrativeResponses).length > 0 ||
            state.customNarratives.length > 0
          )
          const active = i === stepIndex
          return (
            <div
              key={slug}
              className="rounded-full transition-all"
              style={{
                width: active ? 24 : 8,
                height: 8,
                backgroundColor: active
                  ? NODE_MAP[slug].color
                  : done
                  ? NODE_MAP[slug].color + '88'
                  : '#333',
              }}
            />
          )
        })}
      </div>

      {/* Layout principal */}
      <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col lg:flex-row gap-8 items-start">
        {/* Grafo */}
        <div className="w-full lg:w-1/2 flex-shrink-0">
          <ForceGraph
            session={session}
            activeSlug={currentSlug}
            width={420}
            height={420}
          />
        </div>

        {/* Painel lateral */}
        <div className="w-full lg:flex-1 flex flex-col gap-6">
          <NarrativaPanel
            node={currentNode}
            narratives={shownNarratives}
            nodeState={currentState}
            onNarrativeResponse={handleNarrativeResponse}
            onAddCustomNarrative={handleAddCustomNarrative}
            onCustomNarrativeResponse={handleCustomNarrativeResponse}
          />

          <button
            onClick={handleNext}
            className="w-full py-4 rounded-xl font-semibold text-white transition-all hover:opacity-90"
            style={{
              backgroundColor: nodeIsAnswered ? currentNode.color : '#374151',
              cursor: 'pointer',
            }}
          >
            {isLast ? 'Ver meu resultado →' : 'Próximo →'}
          </button>
        </div>
      </div>
    </main>
  )
}

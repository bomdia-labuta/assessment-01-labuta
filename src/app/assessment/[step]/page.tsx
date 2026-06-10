'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ForceGraph } from '@/components/grafo/ForceGraph'
import { NarrativaPanel } from '@/components/grafo/NarrativaPanel'
import { loadSession, updateNodeState } from '@/lib/assessment/session'
import { NODE_MAP } from '@/lib/assessment/nodes'
import type { SessionState, ScaleResponse, NodeSlug, Narrative } from '@/lib/assessment/types'

function sampleNarratives(narratives: Narrative[], n = 3): Narrative[] {
  const copy = [...narratives]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j]!, copy[i]!]
  }
  return copy.slice(0, n)
}

export default function StepPage() {
  const router = useRouter()
  const { step } = useParams<{ step: string }>()
  const stepIndex = parseInt(step, 10)

  const [session, setSession] = useState<SessionState | null>(null)
  const [sampledNarratives, setSampledNarratives] = useState<Narrative[]>([])
  const [taggingTimeout, setTaggingTimeout] = useState<ReturnType<typeof setTimeout> | null>(null)

  // Carregar sessão
  useEffect(() => {
    const s = loadSession()
    if (!s.nodeOrder?.length) { router.replace('/assessment'); return }
    setSession(s)
  }, [router])

  const currentSlug = session?.nodeOrder[stepIndex] ?? null
  const currentNode = currentSlug ? NODE_MAP[currentSlug] : null

  // Buscar narrativas do nó atual
  useEffect(() => {
    if (!currentSlug) return
    fetch(`/api/assessment/narratives?slug=${currentSlug}`)
      .then(r => r.json())
      .then((data: Narrative[]) => {
        setSampledNarratives(sampleNarratives(data))
      })
      .catch(() => setSampledNarratives([]))
  }, [currentSlug])

  const handleAnswer = useCallback((slug: NodeSlug, response: ScaleResponse) => {
    setSession(prev => {
      if (!prev) return prev
      return updateNodeState(prev, slug, { response })
    })
  }, [])

  const handleFreeInput = useCallback((slug: NodeSlug, text: string) => {
    setSession(prev => {
      if (!prev) return prev
      const updated = updateNodeState(prev, slug, { freeInput: text })
      // Classificar tags via Claude Haiku (debounced)
      if (taggingTimeout) clearTimeout(taggingTimeout)
      if (text.trim()) {
        const t = setTimeout(async () => {
          try {
            const res = await fetch('/api/assessment/tags', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text }),
            })
            const { tags } = await res.json() as { tags: string[] }
            setSession(s => s ? updateNodeState(s, slug, { tags }) : s)
          } catch { /* non-blocking */ }
        }, 800)
        setTaggingTimeout(t)
      }
      return updated
    })
  }, [taggingTimeout])

  const currentState = session && currentSlug ? session.nodes[currentSlug] : null
  const isLast = session ? stepIndex === session.nodeOrder.length - 1 : false

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
          const done = !!state?.response
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
            narratives={sampledNarratives}
            currentResponse={currentState?.response ?? null}
            currentFreeInput={currentState?.freeInput ?? ''}
            onAnswer={handleAnswer}
            onFreeInput={handleFreeInput}
          />

          <button
            onClick={handleNext}
            className="w-full py-4 rounded-xl font-semibold text-white transition-all hover:opacity-90"
            style={{ backgroundColor: currentNode.color }}
          >
            {isLast ? 'Ver meu resultado →' : `Próximo →`}
          </button>
        </div>
      </div>
    </main>
  )
}

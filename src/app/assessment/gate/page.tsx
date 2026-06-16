'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { loadSession, clearSession } from '@/lib/assessment/session'
import { ForceGraph } from '@/components/grafo/ForceGraph'
import type { SessionState } from '@/lib/assessment/types'

export default function GatePage() {
  const router = useRouter()
  const [session, setSession] = useState<SessionState | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [consent, setConsent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const graphRef = useRef<any>(null)

  useEffect(() => {
    const s = loadSession()
    if (!s.nodeOrder?.length) { router.replace('/assessment'); return }
    setSession(s)
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/assessment/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, marketing_consent: consent, session }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Erro ao processar')
      }

      const { id } = await res.json() as { id: string }
      clearSession()
      router.push(`/assessment/result/${id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Algo deu errado. Tente novamente.')
      setLoading(false)
    }
  }

  if (!session) return null

  // "Revisado" = nó com pelo menos 1 micro-narrativa respondida
  const reviewedCount = Object.values(session.nodes).filter(
    n => n && Object.keys(n.narrativeResponses ?? {}).length > 0
  ).length
  const MIN_NODES = 3

  if (reviewedCount < MIN_NODES) {
    return (
      <main className="min-h-screen relative flex items-center justify-center px-4"
        style={{ background: '#0e0e12' }}>
        <div className="absolute inset-0 flex items-center justify-center opacity-20 blur-sm pointer-events-none">
          <ForceGraph session={session} activeSlug={null} width={600} height={600} graphRef={graphRef} />
        </div>

        <div className="relative z-10 bg-black/60 backdrop-blur-md rounded-2xl border border-white/10 p-8 w-full max-w-md text-center">
          <p className="text-purple-400 font-bold text-xs tracking-widest uppercase mb-4">LABUTA LABS</p>
          <h1 className="text-2xl font-bold text-white mb-2">Falta pouco para o seu mapa.</h1>
          <p className="text-gray-400 text-sm mb-6 leading-relaxed">
            Para gerar uma leitura sistêmica com valor, é preciso revisar pelo menos{' '}
            <span className="text-white font-semibold">{MIN_NODES} temas</span>.
            Você revisou {reviewedCount} {reviewedCount === 1 ? 'até agora' : 'até agora'}.
            Volte e marque o que ressoa com a sua realidade em mais alguns temas.
          </p>
          <button
            onClick={() => router.push('/assessment')}
            className="bg-purple-600 text-white rounded-xl py-3.5 px-6 font-semibold hover:bg-purple-500 transition-colors text-sm"
          >
            ← Revisar mais temas
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen relative flex items-center justify-center px-4"
      style={{ background: '#0e0e12' }}>

      {/* Grafo ao fundo, desfocado */}
      <div className="absolute inset-0 flex items-center justify-center opacity-30 blur-sm pointer-events-none">
        <ForceGraph session={session} activeSlug={null} width={600} height={600} graphRef={graphRef} />
      </div>

      {/* Formulário */}
      <div className="relative z-10 bg-black/60 backdrop-blur-md rounded-2xl border border-white/10 p-8 w-full max-w-md">
        <p className="text-purple-400 font-bold text-xs tracking-widest uppercase mb-4">LABUTA LABS</p>
        <h1 className="text-2xl font-bold text-white mb-2">Seu mapa está pronto.</h1>
        <p className="text-gray-400 text-sm mb-6">
          Para ver a leitura completa, deixa seu contato.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Seu nome"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-white/30"
          />
          <input
            type="email"
            placeholder="Seu email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-white/30"
          />
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={consent}
              onChange={e => setConsent(e.target.checked)}
              className="mt-0.5 accent-purple-500"
            />
            <span className="text-xs text-gray-500 leading-relaxed">
              Quero receber conteúdos sobre design organizacional da Labuta Labs.
            </span>
          </label>

          {error && (
            <p className="text-red-400 text-sm bg-red-500/10 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="bg-purple-600 text-white rounded-xl py-4 font-semibold hover:bg-purple-500 transition-colors disabled:opacity-60"
          >
            {loading ? 'Gerando seu mapa…' : 'Ver minha leitura sistêmica →'}
          </button>
        </form>

        <p className="text-xs text-gray-600 mt-4 text-center">Sem spam.</p>
      </div>
    </main>
  )
}

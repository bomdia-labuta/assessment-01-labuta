'use client'

import { useEffect, useState } from 'react'

interface LeituraSistemicaProps {
  responseId: string
  initialText?: string | null
}

export function LeituraSistemica({ responseId, initialText }: LeituraSistemicaProps) {
  const [text, setText] = useState(initialText ?? '')
  const [loading, setLoading] = useState(!initialText)

  useEffect(() => {
    if (initialText) return

    let cancelled = false
    async function stream() {
      const res = await fetch(`/api/assessment/leitura?id=${responseId}`)
      if (!res.body) return
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      while (!cancelled) {
        const { done, value } = await reader.read()
        if (done) break
        setText(prev => prev + decoder.decode(value))
      }
      setLoading(false)
    }

    stream().catch(() => setLoading(false))
    return () => { cancelled = true }
  }, [responseId, initialText])

  return (
    <div className="rounded-2xl border border-white/10 p-6 bg-white/5">
      <p className="text-gray-500 text-xs uppercase tracking-wider mb-3">Leitura sistêmica</p>
      {loading && !text && (
        <div className="flex gap-1 items-center text-gray-600 text-sm">
          <span className="animate-pulse">Gerando leitura…</span>
        </div>
      )}
      {text && (
        <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">{text}</p>
      )}
    </div>
  )
}

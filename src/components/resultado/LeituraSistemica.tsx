'use client'

import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'

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
        <ReactMarkdown
          components={{
            h1: ({ children }) => <h1 className="text-white font-bold text-base mb-2 mt-4 first:mt-0">{children}</h1>,
            h2: ({ children }) => <h2 className="text-white font-semibold text-sm mb-2 mt-4 first:mt-0">{children}</h2>,
            h3: ({ children }) => <h3 className="text-gray-200 font-semibold text-sm mb-1 mt-3">{children}</h3>,
            p: ({ children }) => <p className="text-gray-200 text-sm leading-relaxed mb-3 last:mb-0">{children}</p>,
            strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
            em: ({ children }) => <em className="text-gray-300 italic">{children}</em>,
            hr: () => <hr className="border-white/10 my-4" />,
            ul: ({ children }) => <ul className="list-none pl-0 mb-3 flex flex-col gap-1">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal pl-4 mb-3 flex flex-col gap-1 text-gray-200 text-sm">{children}</ol>,
            li: ({ children }) => <li className="text-gray-200 text-sm flex gap-2 before:content-['·'] before:text-purple-400 before:flex-shrink-0">{children}</li>,
          }}
        >
          {text}
        </ReactMarkdown>
      )}
    </div>
  )
}

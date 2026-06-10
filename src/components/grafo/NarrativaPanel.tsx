// src/components/grafo/NarrativaPanel.tsx
'use client'

import { useState } from 'react'
import type { Narrative, NodeSlug, ScaleResponse, AssessmentNode } from '@/lib/assessment/types'

const SCALE_OPTIONS: { value: ScaleResponse; label: string }[] = [
  { value: 'sim', label: 'Sim' },
  { value: 'um_pouco', label: 'Um pouco' },
  { value: 'nao', label: 'Não' },
]

interface NarrativaPanelProps {
  node: AssessmentNode
  narratives: Narrative[]        // 3 sorteadas pelo pai
  currentResponse: ScaleResponse | null
  currentFreeInput: string
  onAnswer: (slug: NodeSlug, response: ScaleResponse) => void
  onFreeInput: (slug: NodeSlug, text: string) => void
}

export function NarrativaPanel({
  node,
  narratives,
  currentResponse,
  currentFreeInput,
  onAnswer,
  onFreeInput,
}: NarrativaPanelProps) {
  const [freeInputValue, setFreeInputValue] = useState(currentFreeInput)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-white font-bold text-xl mb-1" style={{ color: node.color }}>
          {node.label}
        </h2>
      </div>

      {/* Micronarrativas */}
      <div className="flex flex-col gap-3">
        {narratives.map((n) => (
          <p key={n.id} className="text-gray-300 text-sm leading-relaxed border-l-2 pl-3"
            style={{ borderColor: node.color + '66' }}>
            {n.seed_text}
          </p>
        ))}
      </div>

      {/* Escala */}
      <div className="flex gap-2">
        {SCALE_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => onAnswer(node.slug, opt.value)}
            className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all border ${
              currentResponse === opt.value
                ? 'text-white border-transparent'
                : 'text-gray-400 border-gray-700 hover:border-gray-500'
            }`}
            style={
              currentResponse === opt.value
                ? { backgroundColor: node.color, borderColor: node.color }
                : {}
            }
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Input livre */}
      <div>
        <textarea
          value={freeInputValue}
          onChange={e => setFreeInputValue(e.target.value)}
          onBlur={() => onFreeInput(node.slug, freeInputValue)}
          placeholder="Algo que acontece aqui que não apareceu acima?"
          rows={3}
          className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-gray-500 resize-none"
        />
      </div>
    </div>
  )
}

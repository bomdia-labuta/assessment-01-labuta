'use client'

import { useState } from 'react'
import type { Narrative, NodeSlug, ScaleResponse, AssessmentNode, NodeState, CustomNarrative } from '@/lib/assessment/types'

const SCALE_OPTIONS: { value: ScaleResponse; label: string }[] = [
  { value: 'sim', label: 'Sim' },
  { value: 'um_pouco', label: 'Um pouco' },
  { value: 'nao', label: 'Não' },
]

function NarrativeRow({
  text,
  response,
  color,
  onResponse,
}: {
  text: string
  response: ScaleResponse | null
  color: string
  onResponse: (r: ScaleResponse) => void
}) {
  return (
    <div className="flex flex-col gap-2 py-3 border-b border-gray-800 last:border-0">
      <p className="text-gray-300 text-sm leading-relaxed">{text}</p>
      <div className="flex gap-2">
        {SCALE_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => onResponse(opt.value)}
            className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all border"
            style={
              response === opt.value
                ? { backgroundColor: color, borderColor: color, color: '#fff' }
                : { borderColor: '#374151', color: '#9ca3af' }
            }
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function CustomNarrativeForm({
  color,
  onSave,
}: {
  color: string
  onSave: (text: string) => void
}) {
  const [text, setText] = useState('')

  return (
    <div className="flex flex-col gap-2 p-3 rounded-xl border border-dashed" style={{ borderColor: color + '55' }}>
      <p className="text-xs text-gray-500">Qual tensão você vive no dia a dia nesse tema?</p>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Descreva uma situação real…"
        rows={2}
        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-gray-500 resize-none"
        autoFocus
      />
      <button
        onClick={() => { if (text.trim()) { onSave(text.trim()); setText('') } }}
        disabled={!text.trim()}
        className="self-end px-4 py-1.5 rounded-lg text-xs font-semibold text-white transition-all disabled:opacity-30"
        style={{ backgroundColor: color }}
      >
        Adicionar
      </button>
    </div>
  )
}

interface NarrativaPanelProps {
  node: AssessmentNode
  narratives: Narrative[]
  nodeState: NodeState | undefined
  onNarrativeResponse: (slug: NodeSlug, narrativeId: string, response: ScaleResponse) => void
  onAddCustomNarrative: (slug: NodeSlug, text: string) => void
  onCustomNarrativeResponse: (slug: NodeSlug, customId: string, response: ScaleResponse) => void
}

export function NarrativaPanel({
  node,
  narratives,
  nodeState,
  onNarrativeResponse,
  onAddCustomNarrative,
  onCustomNarrativeResponse,
}: NarrativaPanelProps) {
  const [showAddForm, setShowAddForm] = useState(false)

  const handleSaveCustom = (text: string) => {
    onAddCustomNarrative(node.slug, text)
    setShowAddForm(false)
  }

  const customNarratives: CustomNarrative[] = nodeState?.customNarratives ?? []

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-bold text-xl" style={{ color: node.color }}>
        {node.label}
      </h2>

      {/* Micro-narrativas do pool */}
      {narratives.length === 0 ? (
        <p className="text-gray-600 text-sm">Carregando…</p>
      ) : (
        <div className="flex flex-col">
          {narratives.map(n => (
            <NarrativeRow
              key={n.id}
              text={n.seed_text}
              response={nodeState?.narrativeResponses[n.id] ?? null}
              color={node.color}
              onResponse={r => onNarrativeResponse(node.slug, n.id, r)}
            />
          ))}
        </div>
      )}

      {/* Micro-narrativas customizadas */}
      {customNarratives.length > 0 && (
        <div className="flex flex-col">
          {customNarratives.map(cn => (
            <NarrativeRow
              key={cn.id}
              text={cn.text}
              response={cn.response}
              color={node.color}
              onResponse={r => onCustomNarrativeResponse(node.slug, cn.id, r)}
            />
          ))}
        </div>
      )}

      {/* Formulário de adicionar */}
      {showAddForm ? (
        <CustomNarrativeForm color={node.color} onSave={handleSaveCustom} />
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          className="self-start flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors py-1"
        >
          <span className="text-base leading-none">+</span>
          <span>Adicionar situação</span>
        </button>
      )}
    </div>
  )
}

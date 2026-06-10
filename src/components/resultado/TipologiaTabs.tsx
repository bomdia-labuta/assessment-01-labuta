'use client'

import { useState } from 'react'
import type { Tipologia } from '@/lib/assessment/types'

interface TipologiaTabsProps {
  tipologias: Tipologia[]
  recommended: Tipologia | null
}

export function TipologiaTabs({ tipologias, recommended }: TipologiaTabsProps) {
  const [activeTab, setActiveTab] = useState<'recomendacao' | 'alternativa' | 'todas'>('recomendacao')

  const alternative = tipologias.find(t => t.id !== recommended?.id) ?? null
  const rest = tipologias.filter(t => t.id !== recommended?.id && t.id !== alternative?.id)

  const tabs = [
    { id: 'recomendacao' as const, label: 'Recomendação' },
    { id: 'alternativa' as const, label: 'Alternativa' },
    { id: 'todas' as const, label: `Ver todas (${tipologias.length})` },
  ]

  const activeTipologia =
    activeTab === 'recomendacao' ? recommended
    : activeTab === 'alternativa' ? alternative
    : null

  return (
    <div className="flex flex-col gap-4">
      {/* Tabs */}
      <div className="flex gap-1 bg-white/5 rounded-xl p-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-white/10 text-white'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Conteúdo */}
      {activeTab !== 'todas' && activeTipologia && (
        <TipologiaCard tipologia={activeTipologia} />
      )}

      {activeTab === 'todas' && tipologias.map(t => (
        <TipologiaCard key={t.id} tipologia={t} />
      ))}
    </div>
  )
}

function TipologiaCard({ tipologia }: { tipologia: Tipologia }) {
  return (
    <div className="rounded-2xl border border-white/10 p-6 flex flex-col gap-4 bg-white/5">
      <div>
        <h3 className="text-white font-bold text-lg">{tipologia.nome}</h3>
        {tipologia.descricao && (
          <p className="text-gray-400 text-sm mt-1 leading-relaxed">{tipologia.descricao}</p>
        )}
      </div>

      {tipologia.pontos_atencao?.length > 0 && (
        <div>
          <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">Pontos de atenção</p>
          <ul className="flex flex-col gap-1">
            {tipologia.pontos_atencao.map((p, i) => (
              <li key={i} className="text-gray-300 text-sm flex gap-2">
                <span className="text-purple-400">·</span> {p}
              </li>
            ))}
          </ul>
        </div>
      )}

      {tipologia.cta && (
        <p className="text-gray-500 text-sm italic">{tipologia.cta}</p>
      )}
    </div>
  )
}

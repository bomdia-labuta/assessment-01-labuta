import { ARTEFATOS_ESTRUTURAIS } from '@/lib/ai/report-prompt'
import { TIPOLOGIAS } from '@/lib/assessment/tipologias'
import type { VariavelDirecao } from '@/lib/assessment/tipologias'
import type { RelatorioEstruturado as Relatorio } from '@/lib/ai/report-schema'

const ARTEFATO_LABEL: Record<string, string> = Object.fromEntries(
  ARTEFATOS_ESTRUTURAIS.map(a => [a.id, a.label])
)

const DIR_SYMBOL: Record<VariavelDirecao, string> = { up: '↑', down: '↓', neutral: '~' }
const DIR_COLOR: Record<VariavelDirecao, string> = {
  up: 'text-emerald-400',
  down: 'text-rose-400',
  neutral: 'text-gray-400',
}

const NIVEIS = [
  { key: 'eventos', label: 'Eventos', hint: 'O que aparece na superfície' },
  { key: 'padroes', label: 'Padrões', hint: 'Comportamentos recorrentes' },
  { key: 'estruturas', label: 'Estruturas', hint: 'O que sustenta os padrões' },
  { key: 'modelos', label: 'Modelos mentais', hint: 'Pressupostos que condicionam' },
] as const

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-purple-400 font-semibold text-sm tracking-wide mb-3">{children}</h2>
  )
}

function VariavelBadge({ nome, direcao }: { nome: string; direcao: VariavelDirecao }) {
  return (
    <span className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-gray-300">
      <span className={`font-bold ${DIR_COLOR[direcao]}`}>{DIR_SYMBOL[direcao]}</span>
      {nome}
    </span>
  )
}

export function RelatorioEstruturado({ data }: { data: Relatorio }) {
  const tip = TIPOLOGIAS[data.tipologia.tipologiaId]

  return (
    <div className="flex flex-col gap-8">
      {/* Nota — postura de hipótese */}
      <div className="rounded-xl border-l-2 border-amber-400/60 bg-amber-400/5 px-5 py-4">
        <p className="text-amber-200/90 text-sm leading-relaxed">
          <span className="font-semibold">Uma nota sobre essa leitura:</span> isto é uma hipótese,
          não um diagnóstico. O sistema que você opera é único — esta leitura é um ponto de partida
          para explorar, não uma verdade sobre o que está errado.
        </p>
      </div>

      {/* BLOCO 1 — Leitura do sistema (4 níveis) */}
      <section>
        <SectionTitle>A leitura do sistema</SectionTitle>
        <div className="grid sm:grid-cols-2 gap-3">
          {NIVEIS.map(n => (
            <div key={n.key} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-baseline justify-between mb-1.5">
                <h3 className="text-white font-semibold text-sm">{n.label}</h3>
                <span className="text-gray-600 text-[10px] uppercase tracking-wider">{n.hint}</span>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed">{data.leituraSistema[n.key]}</p>
            </div>
          ))}
        </div>
        <p className="text-gray-600 text-xs mt-3 italic">
          Os quatro níveis se influenciam em círculo — não há causa raiz, há um sistema que se sustenta.
        </p>
      </section>

      {/* BLOCO 2A — Artefatos estruturais impactados */}
      {data.artefatosImpactados.length > 0 && (
        <section>
          <SectionTitle>Artefatos estruturais impactados</SectionTitle>
          <div className="flex flex-col gap-3">
            {data.artefatosImpactados.map((a, i) => (
              <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <span className="inline-block bg-purple-500/15 text-purple-300 text-xs font-semibold rounded-md px-2 py-0.5 mb-2">
                  {ARTEFATO_LABEL[a.artefatoId] ?? a.artefatoId}
                </span>
                <p className="text-gray-200 text-sm leading-relaxed">{a.comoImpacta}</p>
                <p className="text-gray-500 text-xs mt-2 leading-relaxed">
                  <span className="text-gray-600">Tensão relacionada:</span> {a.tensaoRelacionada}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* BLOCO 2B — Loops de feedback */}
      {data.loops.length > 0 && (
        <section>
          <SectionTitle>Loops de feedback</SectionTitle>
          <div className="flex flex-col gap-3">
            {data.loops.map((loop, i) => (
              <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-base">🔁</span>
                  <h3 className="text-white font-semibold text-sm">{loop.titulo}</h3>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed mb-3">{loop.descricao}</p>
                {loop.variaveis.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {loop.variaveis.map((v, j) => (
                      <VariavelBadge key={j} nome={v.nome} direcao={v.direcao} />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* BLOCO 3 — Tipologia de intervenção */}
      {tip && (
        <section>
          <SectionTitle>Onde pode valer experimentar — tipologia de intervenção</SectionTitle>
          <div className="rounded-2xl border border-purple-500/20 bg-purple-500/[0.03] p-6 flex flex-col gap-5">
            {/* Header */}
            <div className="flex items-start gap-3">
              <span className="text-2xl leading-none">{tip.icon}</span>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-white font-bold text-lg">{tip.name}</h3>
                  <span className="bg-purple-500/15 text-purple-300 text-xs font-medium rounded-md px-2 py-0.5">
                    {tip.categoryLabel}
                  </span>
                </div>
                <p className="text-gray-400 text-sm mt-1 leading-relaxed">{tip.shortDescription}</p>
              </div>
            </div>

            {/* Grid: efeitos | feedback loop */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-gray-200 text-xs font-semibold mb-2">⚡ Efeitos esperados</p>
                <ul className="flex flex-col gap-1.5">
                  {tip.effects.map((e, i) => (
                    <li key={i} className="text-gray-400 text-xs leading-relaxed flex gap-2">
                      <span className="text-purple-400 flex-shrink-0">·</span>{e}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-gray-200 text-xs font-semibold mb-2">🔁 Feedback loop</p>
                <ul className="flex flex-col gap-2">
                  <li className="text-gray-400 text-xs leading-relaxed flex gap-2">
                    <span className="text-emerald-400 font-bold flex-shrink-0">+</span>{tip.feedbackLoop.positive}
                  </li>
                  <li className="text-gray-400 text-xs leading-relaxed flex gap-2">
                    <span className="text-rose-400 font-bold flex-shrink-0">−</span>{tip.feedbackLoop.risk}
                  </li>
                  <li className="text-gray-400 text-xs leading-relaxed flex gap-2">
                    <span className="text-amber-400 flex-shrink-0">↻</span>{tip.feedbackLoop.observe}
                  </li>
                </ul>
              </div>
            </div>

            {/* Variáveis que sinaliza */}
            {tip.variables.length > 0 && (
              <div>
                <p className="text-gray-200 text-xs font-semibold mb-2">Variáveis que sinaliza</p>
                <div className="flex flex-wrap gap-2">
                  {tip.variables.map((v, i) => (
                    <VariavelBadge key={i} nome={v.name} direcao={v.direction} />
                  ))}
                </div>
              </div>
            )}

            {/* Por que essa tipologia (gerado para este sistema) */}
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-gray-200 text-xs font-semibold mb-1.5">Por que essa tipologia para o seu sistema</p>
              <p className="text-gray-300 text-sm leading-relaxed">{data.tipologia.porque}</p>
            </div>

            {/* Experimentos — cada um endereça um artefato */}
            {data.tipologia.experimentos.length > 0 && (
              <div>
                <p className="text-gray-200 text-xs font-semibold mb-2">✏️ Possíveis experimentos</p>
                <div className="flex flex-col gap-3">
                  {data.tipologia.experimentos.slice(0, 3).map((exp, i) => (
                    <div key={i} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="flex items-start justify-between gap-3 mb-1.5">
                        <h4 className="text-white font-semibold text-sm">{exp.titulo}</h4>
                        <span className="bg-purple-500/15 text-purple-300 text-[10px] font-medium rounded-md px-2 py-0.5 whitespace-nowrap flex-shrink-0">
                          endereça: {ARTEFATO_LABEL[exp.artefatoId] ?? exp.artefatoId}
                        </span>
                      </div>
                      <p className="text-gray-400 text-xs leading-relaxed">{exp.descricao}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  )
}

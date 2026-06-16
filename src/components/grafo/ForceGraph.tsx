'use client'

import { useMemo, useState } from 'react'
import type { SessionState, NodeSlug } from '@/lib/assessment/types'
import { ASSESSMENT_NODES } from '@/lib/assessment/nodes'

export interface ForceGraphProps {
  session: SessionState
  activeSlug: NodeSlug | null
  width?: number
  height?: number
  onNodeClick?: (slug: NodeSlug) => void
  graphRef?: React.Ref<SVGSVGElement>
}

const STATUS = {
  critico: { color: '#E05252', label: 'CRÍTICO' },
  atencao: { color: '#E07E52', label: 'ATENÇÃO' },
  ativo:   { color: '#4CAF91', label: 'ATIVO' },
  inativo: { color: '#555566', label: '' },
} as const
type StatusKey = keyof typeof STATUS

function getStatus(rawScore: number, shownCount: number): StatusKey {
  if (shownCount === 0 || rawScore === 0) return 'inativo'
  const pct = rawScore / shownCount
  if (pct >= 0.75) return 'critico'
  if (pct >= 0.40) return 'atencao'
  return 'ativo'
}

function jaccard(a: string[], b: string[]): number {
  if (!a.length && !b.length) return 0
  const setA = new Set(a)
  const unionSize = new Set([...a, ...b]).size
  const intersectionSize = b.filter(t => setA.has(t)).length
  return intersectionSize / unionSize
}

function computeLayout(
  n: number,
  similarity: number[][],
  radii: number[],
  width: number,
  height: number,
  iterations = 300,
): { x: number; y: number }[] {
  const pad = 72
  const w = width - pad * 2
  const h = height - pad * 2
  const k = Math.sqrt((w * h) / n) * 0.40

  const rng = (seed: number) => {
    const x = Math.sin(seed * 9301 + 49297) * 233280
    return x - Math.floor(x)
  }
  const pos = Array.from({ length: n }, (_, i) => ({
    x: pad + rng(i * 2 + 1) * w,
    y: pad + rng(i * 2 + 2) * h,
    vx: 0, vy: 0,
  }))

  for (let iter = 0; iter < iterations; iter++) {
    const cooling = 1 - iter / iterations
    const temp = k * 2.0 * cooling

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const dx = pos[i]!.x - pos[j]!.x
        const dy = pos[i]!.y - pos[j]!.y
        const dist = Math.max(0.1, Math.sqrt(dx * dx + dy * dy))
        const nx = dx / dist, ny = dy / dist

        const fr = (k * k) / dist
        pos[i]!.vx += nx * fr; pos[i]!.vy += ny * fr
        pos[j]!.vx -= nx * fr; pos[j]!.vy -= ny * fr

        const minDist = (radii[i]! + radii[j]!) * 1.6 + 24
        if (dist < minDist) {
          const push = (minDist - dist) * 4.5
          pos[i]!.vx += nx * push; pos[i]!.vy += ny * push
          pos[j]!.vx -= nx * push; pos[j]!.vy -= ny * push
        }

        const sim = similarity[i]![j]!
        if (sim > 0) {
          const fa = (dist * dist / k) * sim * 0.85
          pos[i]!.vx -= nx * fa; pos[i]!.vy -= ny * fa
          pos[j]!.vx += nx * fa; pos[j]!.vy += ny * fa
        }
      }
    }

    const gravity = 0.09
    for (let i = 0; i < n; i++) {
      pos[i]!.vx += (width / 2 - pos[i]!.x) * gravity
      pos[i]!.vy += (height / 2 - pos[i]!.y) * gravity
    }

    for (let i = 0; i < n; i++) {
      const len = Math.sqrt(pos[i]!.vx ** 2 + pos[i]!.vy ** 2)
      if (len > 0) {
        const scale = Math.min(len, temp) / len
        pos[i]!.x += pos[i]!.vx * scale
        pos[i]!.y += pos[i]!.vy * scale
        pos[i]!.x = Math.max(pad, Math.min(width - pad, pos[i]!.x))
        pos[i]!.y = Math.max(pad, Math.min(height - pad, pos[i]!.y))
      }
      pos[i]!.vx = 0; pos[i]!.vy = 0
    }
  }

  const margin = 68
  const xs = pos.map(p => p.x), ys = pos.map(p => p.y)
  const minX = Math.min(...xs), maxX = Math.max(...xs)
  const minY = Math.min(...ys), maxY = Math.max(...ys)
  const spanX = maxX - minX || 1, spanY = maxY - minY || 1
  const scale = Math.min((width - margin * 2) / spanX, (height - margin * 2) / spanY, 1.6)
  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2

  return pos.map(({ x, y }) => ({
    x: Math.max(margin, Math.min(width - margin, width / 2 + (x - cx) * scale)),
    y: Math.max(margin, Math.min(height - margin, height / 2 + (y - cy) * scale)),
  }))
}

function wrapLabel(text: string, max = 14): [string, string?] {
  if (text.length <= max) return [text]
  const words = text.split(' ')
  let a = '', b = ''
  for (const w of words) {
    if ((a + ' ' + w).trim().length <= max && !b) a = (a + ' ' + w).trim()
    else b = (b + ' ' + w).trim()
  }
  return [a, b || undefined]
}

type NodeDatum = {
  slug: string
  label: string
  rawScore: number
  shownCount: number
  activatedTags: string[]
  isVisited: boolean
  statusKey: StatusKey
  r: number
}

type EdgeDatum = {
  i: number
  j: number
  sharedTags: string[]
  weight: 'forte' | 'media' | 'fraca'
}

const NODE_MIN_R = 22
const NODE_MAX_R = 44
const NODE_UNVISITED_R = 12

export function ForceGraph({
  session,
  activeSlug,
  width = 640,
  height = 440,
  onNodeClick,
  graphRef,
}: ForceGraphProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const [hoveredEdge, setHoveredEdge] = useState<number | null>(null)

  const nodeData: NodeDatum[] = useMemo(() => {
    const raw = ASSESSMENT_NODES.map(n => {
      const state = session.nodes[n.slug as NodeSlug]
      const responses = state?.narrativeResponses ?? {}
      const custom = state?.customNarratives ?? []
      const rawScore =
        Object.values(responses).reduce((s, r) => s + (r === 'sim' ? 1 : r === 'um_pouco' ? 0.5 : 0), 0) +
        custom.reduce((s, cn) => s + (cn.response === 'sim' ? 1 : cn.response === 'um_pouco' ? 0.5 : 0), 0)
      const shownCount = Math.max(1, (state?.shownNarrativeIds?.length ?? 4) + custom.length)
      const isVisited = Object.keys(responses).length > 0 || custom.length > 0
      const activatedTags = state?.activatedTags ?? []
      const statusKey: StatusKey = isVisited ? getStatus(rawScore, shownCount) : 'inativo'
      return { slug: n.slug, label: n.label, rawScore, shownCount, activatedTags, isVisited, statusKey, r: 0 }
    })
    const maxRaw = Math.max(0.01, ...raw.map(nd => nd.rawScore))
    return raw.map(nd => ({
      ...nd,
      r: nd.isVisited
        ? NODE_MIN_R + (nd.rawScore / maxRaw) * (NODE_MAX_R - NODE_MIN_R)
        : NODE_UNVISITED_R,
    }))
  }, [session])

  const edges: EdgeDatum[] = useMemo(() => {
    const result: EdgeDatum[] = []
    for (let i = 0; i < nodeData.length; i++) {
      if (!nodeData[i]!.isVisited) continue
      for (let j = i + 1; j < nodeData.length; j++) {
        if (!nodeData[j]!.isVisited) continue
        const setI = new Set(nodeData[i]!.activatedTags)
        const shared = nodeData[j]!.activatedTags.filter(t => setI.has(t))
        if (!shared.length) continue
        result.push({
          i, j, sharedTags: shared,
          weight: shared.length >= 3 ? 'forte' : shared.length === 2 ? 'media' : 'fraca',
        })
      }
    }
    return result
  }, [nodeData])

  const positions = useMemo(() => {
    const n = nodeData.length
    const radii = nodeData.map(nd => nd.r)
    const similarity = Array.from({ length: n }, (_, i) =>
      Array.from({ length: n }, (_, j) =>
        i === j ? 0 : jaccard(nodeData[i]!.activatedTags, nodeData[j]!.activatedTags)
      )
    )
    return computeLayout(n, similarity, radii, width, height)
  }, [nodeData, width, height])

  // Isolamento: IDs conectados ao nó selecionado
  const connectedSlugs = useMemo(() => {
    if (!selected) return null
    const set = new Set([selected])
    edges.forEach(e => {
      if (nodeData[e.i]!.slug === selected) set.add(nodeData[e.j]!.slug)
      if (nodeData[e.j]!.slug === selected) set.add(nodeData[e.i]!.slug)
    })
    return set
  }, [selected, edges, nodeData])

  const nodeDim = (slug: string) => {
    if (!selected) return 1
    if (slug === selected) return 1
    if (connectedSlugs!.has(slug)) return 0.55
    return 0.08
  }

  const edgeDim = (e: EdgeDatum) => {
    if (!selected) return 1
    if (nodeData[e.i]!.slug === selected || nodeData[e.j]!.slug === selected) return 1
    return 0.05
  }

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        backgroundColor: '#0D0D0D',
        backgroundImage: 'radial-gradient(circle, #1C1C1C 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }}
      onClick={() => setSelected(null)}
    >
      <svg
        ref={graphRef as React.Ref<SVGSVGElement>}
        width={width}
        height={height}
        style={{ display: 'block' }}
      >
        <defs>
          {nodeData.map(nd => {
            if (!nd.isVisited) return null
            const color = STATUS[nd.statusKey].color
            return (
              <radialGradient key={nd.slug} id={`grad-${nd.slug}`} cx="50%" cy="50%" r="50%">
                <stop offset="0%"   stopColor={color} stopOpacity="0.35" />
                <stop offset="70%"  stopColor={color} stopOpacity="0.08" />
                <stop offset="100%" stopColor={color} stopOpacity="0" />
              </radialGradient>
            )
          })}
          <filter id="critico-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Arestas */}
        <g>
          {edges.map((edge, k) => {
            const pi = positions[edge.i]!, pj = positions[edge.j]!
            const sx = pi.x, sy = pi.y, tx = pj.x, ty = pj.y
            const mx = (sx + tx) / 2, my = (sy + ty) / 2
            const dx = tx - sx, dy = ty - sy
            const len = Math.sqrt(dx * dx + dy * dy) || 1
            const off = 35
            const cpx = mx + (-dy / len) * off
            const cpy = my + (dx / len) * off
            const labelX = mx + (-dy / len) * (off * 0.6)
            const labelY = my + (dx / len) * (off * 0.6)

            const color = nodeData[edge.i]!.rawScore >= nodeData[edge.j]!.rawScore
              ? STATUS[nodeData[edge.i]!.statusKey].color
              : STATUS[nodeData[edge.j]!.statusKey].color

            const dim = edgeDim(edge)
            const isHov = hoveredEdge === k
            const baseOp = edge.weight === 'forte' ? 0.60 : edge.weight === 'media' ? 0.42 : 0.25
            const strokeW = edge.weight === 'forte' ? 2 : edge.weight === 'media' ? 1.5 : 1
            const dash = edge.weight === 'media' ? '5 3' : undefined

            const tagText = edge.sharedTags.slice(0, 3).join(' · ')
            const tagBoxW = Math.min(tagText.length * 5.5 + 16, 180)

            return (
              <g key={k} style={{ opacity: dim, transition: 'opacity 0.25s' }}>
                {/* Linha principal */}
                <path
                  d={`M${sx},${sy} Q${cpx},${cpy} ${tx},${ty}`}
                  fill="none"
                  stroke={color}
                  strokeOpacity={isHov ? Math.min(baseOp * 1.6, 0.9) : baseOp}
                  strokeWidth={isHov ? strokeW + 0.5 : strokeW}
                  strokeDasharray={dash}
                  strokeLinecap="round"
                />
                {/* Área invisível para hover */}
                <path
                  d={`M${sx},${sy} Q${cpx},${cpy} ${tx},${ty}`}
                  fill="none"
                  stroke="transparent"
                  strokeWidth="18"
                  style={{ cursor: 'default' }}
                  onMouseEnter={() => setHoveredEdge(k)}
                  onMouseLeave={() => setHoveredEdge(null)}
                />
                {/* Badge circular com contagem */}
                <circle cx={labelX} cy={labelY} r={9} fill="#0D0D0D" stroke={color} strokeOpacity={0.5} strokeWidth={1} />
                <text
                  x={labelX} y={labelY + 3.5}
                  textAnchor="middle"
                  fontSize={9}
                  fontWeight={600}
                  fill={color}
                  style={{ fontFamily: 'ui-monospace, monospace', pointerEvents: 'none' }}
                >
                  {edge.sharedTags.length}
                </text>
                {/* Tooltip de tags no hover */}
                {isHov && (
                  <g style={{ pointerEvents: 'none' }}>
                    <rect
                      x={labelX - tagBoxW / 2}
                      y={labelY + 14}
                      width={tagBoxW}
                      height={16}
                      rx={4}
                      fill="rgba(13,13,13,0.95)"
                      stroke={color}
                      strokeOpacity={0.5}
                      strokeWidth={1}
                    />
                    <text
                      x={labelX} y={labelY + 24}
                      textAnchor="middle"
                      fontSize={8}
                      fill="rgba(255,255,255,0.85)"
                    >
                      {tagText}
                    </text>
                  </g>
                )}
              </g>
            )
          })}
        </g>

        {/* Nós */}
        <g>
          {nodeData.map((nd, i) => {
            const pos = positions[i]!
            const { color, label: statusLabel } = STATUS[nd.statusKey]
            const r = nd.r
            const isSelected = nd.slug === selected || nd.slug === activeSlug
            const dim = nodeDim(nd.slug)
            const [line1, line2] = wrapLabel(nd.label)
            const hasStatus = nd.isVisited && statusLabel

            return (
              <g
                key={nd.slug}
                transform={`translate(${pos.x},${pos.y})`}
                style={{ opacity: dim, transition: 'opacity 0.3s', cursor: onNodeClick ? 'pointer' : 'default' }}
                onClick={(e) => {
                  e.stopPropagation()
                  if (onNodeClick) onNodeClick(nd.slug as NodeSlug)
                  setSelected(nd.slug === selected ? null : nd.slug)
                }}
              >
                {/* Halo de glow para CRÍTICO */}
                {nd.statusKey === 'critico' && (
                  <circle r={r + 4} fill={color} fillOpacity={0.12} filter="url(#critico-glow)" />
                )}

                {/* Anel pulsante se selecionado */}
                {isSelected && (
                  <circle r={r + 9} fill="none" stroke={color} strokeWidth={1.2} strokeOpacity={0.55} />
                )}

                {/* Base escura */}
                <circle r={r} fill="#141414" />

                {/* Gradiente radial (só visitados) */}
                {nd.isVisited && <circle r={r} fill={`url(#grad-${nd.slug})`} />}

                {/* Borda */}
                <circle
                  r={r}
                  fill="none"
                  stroke={nd.isVisited ? color : 'rgba(255,255,255,0.18)'}
                  strokeWidth={isSelected ? 2.5 : nd.isVisited ? 1.8 : 1}
                  strokeOpacity={nd.isVisited ? (isSelected ? 1 : 0.85) : 1}
                  strokeDasharray={nd.isVisited ? undefined : '3 4'}
                />

                {/* Anel interno sutil */}
                {nd.isVisited && (
                  <circle r={r - 7} fill="none" stroke={color} strokeOpacity={0.15} strokeWidth={1} />
                )}

                {/* Nome do tema dentro do nó (visitado) */}
                {nd.isVisited ? (
                  <>
                    <text
                      textAnchor="middle"
                      y={line2 ? -5 : 3}
                      fontSize={9.5}
                      fontWeight={500}
                      fill="#FFFFFFCC"
                      style={{ pointerEvents: 'none' }}
                    >
                      {line1}
                    </text>
                    {line2 && (
                      <text
                        textAnchor="middle"
                        y={9}
                        fontSize={9.5}
                        fontWeight={500}
                        fill="#FFFFFFCC"
                        style={{ pointerEvents: 'none' }}
                      >
                        {line2}
                      </text>
                    )}
                  </>
                ) : (
                  /* Nome abaixo para não visitados */
                  <>
                    <text
                      textAnchor="middle"
                      y={r + 13}
                      fontSize={8.5}
                      fill="rgba(255,255,255,0.22)"
                      style={{ pointerEvents: 'none' }}
                    >
                      {line1}
                    </text>
                    {line2 && (
                      <text
                        textAnchor="middle"
                        y={r + 24}
                        fontSize={8.5}
                        fill="rgba(255,255,255,0.22)"
                        style={{ pointerEvents: 'none' }}
                      >
                        {line2}
                      </text>
                    )}
                  </>
                )}

                {/* Status abaixo do nó (visitado) */}
                {hasStatus && (
                  <text
                    textAnchor="middle"
                    y={r + 15}
                    fontSize={8.5}
                    fontWeight={600}
                    fill={color}
                    style={{ letterSpacing: '0.28em', pointerEvents: 'none' }}
                  >
                    {statusLabel}
                  </text>
                )}
              </g>
            )
          })}
        </g>
      </svg>

      {/* Barra de legenda */}
      <div
        className="flex items-center justify-between px-5 py-2.5 border-t"
        style={{ borderColor: 'rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center gap-5">
          <span style={{ color: 'rgba(255,255,255,0.28)', fontSize: 9, letterSpacing: '0.12em' }}>TENSÕES</span>
          {([
            ['FORTE', undefined, 2, '#FFFFFF80'],
            ['MÉDIA', '5 3', 1.5, '#FFFFFF80'],
            ['FRACA', undefined, 1, '#FFFFFF40'],
          ] as const).map(([label, dash, w, stroke]) => (
            <div key={label} className="flex items-center gap-1.5">
              <svg width="28" height="6" style={{ display: 'block' }}>
                <line x1="0" y1="3" x2="28" y2="3" stroke={stroke} strokeWidth={w} strokeDasharray={dash} />
              </svg>
              <span style={{ color: 'rgba(255,255,255,0.28)', fontSize: 9 }}>{label}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-5">
          <span style={{ color: 'rgba(255,255,255,0.28)', fontSize: 9, letterSpacing: '0.12em' }}>STATUS</span>
          {(['ativo', 'atencao', 'critico'] as StatusKey[]).map(sk => (
            <div key={sk} className="flex items-center gap-1.5">
              <svg width="10" height="10" style={{ display: 'block' }}>
                <circle cx="5" cy="5" r="4" fill="#0D0D0D" stroke={STATUS[sk].color} strokeWidth="1.5" />
              </svg>
              <span style={{ color: 'rgba(255,255,255,0.28)', fontSize: 9 }}>{STATUS[sk].label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Hint de interação */}
      {!selected && edges.length > 0 && (
        <div
          className="text-center pb-2 text-[9px] uppercase tracking-[0.3em] pointer-events-none"
          style={{ color: 'rgba(255,255,255,0.18)' }}
        >
          Clique em um tema para isolar suas conexões
        </div>
      )}

      <style>{`
        @keyframes badge-pulse {
          0%, 100% { transform: scale(1); opacity: 0.55; }
          50% { transform: scale(1.1); opacity: 0.15; }
        }
      `}</style>
    </div>
  )
}

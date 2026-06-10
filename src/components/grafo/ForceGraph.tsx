// src/components/grafo/ForceGraph.tsx
'use client'

import dynamic from 'next/dynamic'
import { useMemo } from 'react'
import type { SessionState, NodeSlug } from '@/lib/assessment/types'
import { ASSESSMENT_NODES } from '@/lib/assessment/nodes'

interface GNode {
  id: NodeSlug
  label: string
  color: string
  score: number
  isActive: boolean
  isVisited: boolean
  x?: number
  y?: number
}

interface GLink {
  source: NodeSlug
  target: NodeSlug
  strength: number
}

interface ForceGraph2DProps {
  graphData: { nodes: GNode[]; links: GLink[] }
  width?: number
  height?: number
  backgroundColor?: string
  nodeLabel?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  nodeCanvasObject?: (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => void
  nodeCanvasObjectMode?: () => string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  linkColor?: (link: any) => string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  linkWidth?: (link: any) => number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onNodeClick?: (node: any) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ref?: React.Ref<any>
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ForceGraph2D = dynamic<ForceGraph2DProps>(
  () => import('react-force-graph').then(m => m.ForceGraph2D as React.ComponentType<ForceGraph2DProps>),
  { ssr: false }
)

export interface ForceGraphProps {
  session: SessionState
  activeSlug: NodeSlug | null
  width?: number
  height?: number
  onNodeClick?: (slug: NodeSlug) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  graphRef?: React.Ref<any>
}

export function ForceGraph({
  session,
  activeSlug,
  width = 420,
  height = 420,
  onNodeClick,
  graphRef,
}: ForceGraphProps) {
  const graphData = useMemo(() => {
    const nodes: GNode[] = ASSESSMENT_NODES.map(n => {
      const state = session.nodes[n.slug]
      const score =
        state?.response === 'sim' ? 1.0
        : state?.response === 'um_pouco' ? 0.5
        : state?.response === 'nao' ? 0.0
        : -1  // -1 = não visitado
      return {
        id: n.slug,
        label: n.label,
        color: n.color,
        score,
        isActive: n.slug === activeSlug,
        isVisited: score >= 0,
      }
    })

    const links: GLink[] = []
    const slugs = ASSESSMENT_NODES.map(n => n.slug)
    for (let i = 0; i < slugs.length; i++) {
      for (let j = i + 1; j < slugs.length; j++) {
        const a = session.nodes[slugs[i]!]
        const b = session.nodes[slugs[j]!]
        if (!a?.tags.length || !b?.tags.length) continue
        const shared = a.tags.filter(t => b.tags.includes(t)).length
        if (shared > 0) {
          links.push({ source: slugs[i]!, target: slugs[j]!, strength: Math.min(1, shared * 0.25) })
        }
      }
    }

    return { nodes, links }
  }, [session, activeSlug])

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: '#0e0e12' }}>
      <ForceGraph2D
        ref={graphRef}
        graphData={graphData}
        width={width}
        height={height}
        backgroundColor="#0e0e12"
        nodeLabel="label"
        nodeCanvasObjectMode={() => 'replace'}
        nodeCanvasObject={(node: GNode, ctx: CanvasRenderingContext2D) => {
          const x = node.x ?? 0
          const y = node.y ?? 0
          const size = node.isActive ? 12 : node.score > 0 ? 6 + node.score * 6 : 5

          ctx.beginPath()

          if (!node.isVisited) {
            ctx.setLineDash([3, 3])
            ctx.strokeStyle = node.color + '55'
            ctx.lineWidth = 1
            ctx.arc(x, y, size, 0, 2 * Math.PI)
            ctx.stroke()
            ctx.setLineDash([])
          } else {
            if (node.isActive || node.score === 1.0) {
              ctx.shadowColor = node.color
              ctx.shadowBlur = 18
            }
            const alpha =
              node.score === 1.0 ? 'ff'
              : node.score === 0.5 ? '99'
              : '33'
            ctx.fillStyle = node.color + alpha
            ctx.arc(x, y, size, 0, 2 * Math.PI)
            ctx.fill()
            ctx.shadowBlur = 0
          }

          // Label
          ctx.font = `${node.isActive ? 'bold ' : ''}10px sans-serif`
          ctx.fillStyle = node.isVisited ? '#ffffff99' : '#ffffff33'
          ctx.textAlign = 'center'
          ctx.fillText(node.label, x, y + size + 10)
        }}
        linkColor={(link: GLink) => `rgba(255,255,255,${link.strength * 0.4})`}
        linkWidth={(link: GLink) => link.strength * 2}
        onNodeClick={(node: GNode) => onNodeClick?.(node.id)}
      />
    </div>
  )
}

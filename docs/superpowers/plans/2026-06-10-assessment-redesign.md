# Assessment Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesenhar o assessment Labuta para grafo dark & cinematic (react-force-graph-2d), fluxo sequencial por nó, escala Sim/Um pouco/Não, micronarrativas vindas do Supabase, gate pós-assessment, resultado com tabs e leitura sistêmica em streaming.

**Architecture:** Substituição quase completa do design anterior. A stack permanece (Next.js 14 + Supabase + Claude API + Resend), mas tipos, componentes de grafo, lógica de scoring e schema são substituídos. Abordagem incremental por camada: dados → grafo → fluxo → resultado → email.

**Tech Stack:** Next.js 14, React 19, TypeScript, Tailwind CSS, react-force-graph-2d, @anthropic-ai/sdk, Supabase, Resend, React Email

---

## Contexto: estado atual vs novo design

O codebase existente usa um design diferente (binário ressoa/nao_tanto, grafo SVG, sem steps sequenciais). Estes arquivos serão **substituídos** — não há conflito com o novo design:

| Arquivo existente | Destino |
|---|---|
| `src/lib/assessment/types.ts` | Substituído (Task 3) |
| `src/lib/assessment/scoring.ts` | Substituído (Task 4) |
| `src/app/assessment/page.tsx` | Substituído (Task 9) |
| `src/app/assessment/gate/page.tsx` | Substituído (Task 11) |
| `src/app/assessment/result/[id]/page.tsx` | Substituído (Task 13) |
| `src/app/api/assessment/submit/route.ts` | Substituído (Task 11) |
| `src/components/grafo/GrafoCanvas.tsx` | Substituído (Task 7) |
| `src/components/grafo/NarrativaPanel.tsx` | Substituído (Task 8) |
| `src/lib/ai/orgDesigner.ts` | Substituído (Task 12) |
| `src/lib/ai/flora-prompt.ts` | Pode ser removido após Task 12 |
| `src/lib/ai/parseFloraOutput.ts` | Pode ser removido após Task 12 |

Estes arquivos são **mantidos sem mudança**:
- `src/lib/supabase/client.ts` e `server.ts`
- `src/app/layout.tsx`, `globals.css`, `page.tsx`

---

## Mapa de arquivos

| Arquivo | Ação | Responsabilidade |
|---|---|---|
| `src/lib/assessment/types.ts` | Substituir | Tipos base: NodeSlug, ScaleResponse, SessionState, Tipologia |
| `src/lib/assessment/nodes.ts` | Criar | 9 nós com slug, label, cor |
| `src/lib/assessment/scoring.ts` | Substituir | calculateNodeScore, getTopNodes |
| `src/lib/assessment/session.ts` | Criar | localStorage session helpers |
| `src/lib/supabase/responses.ts` | Criar | CRUD helpers para assessment_responses |
| `src/lib/ai/tagging.ts` | Criar | Claude Haiku: classifica texto livre em tags |
| `src/lib/ai/leitura.ts` | Criar | Claude streaming: gera leitura sistêmica |
| `src/lib/email/result-template.tsx` | Criar | React Email template |
| `src/components/grafo/ForceGraph.tsx` | Criar | Wrapper react-force-graph-2d |
| `src/components/grafo/NarrativaPanel.tsx` | Substituir | UI de step: narrativas + escala + input livre |
| `src/components/resultado/TipologiaTabs.tsx` | Criar | Tabs Recomendação/Alternativa/Ver todas |
| `src/app/assessment/page.tsx` | Substituir | Redireciona para /assessment/0 |
| `src/app/assessment/[step]/page.tsx` | Criar | Página de cada nó (0–8) |
| `src/app/assessment/gate/page.tsx` | Substituir | Gate nome + email com grafo ao fundo |
| `src/app/assessment/result/[id]/page.tsx` | Substituir | Grafo + leitura sistêmica + tabs |
| `src/app/api/assessment/tags/route.ts` | Criar | POST: classifica input livre via Claude Haiku |
| `src/app/api/assessment/submit/route.ts` | Substituir | POST: salva response + dispara email |
| `src/app/api/assessment/leitura/route.ts` | Criar | GET: streaming da leitura sistêmica |
| `supabase/migrations/001_assessment_typologies.sql` | Já criado | Tabela de tipologias |
| `supabase/migrations/002_assessment_narratives.sql` | Já criado | Pool de micronarrativas |
| `supabase/migrations/003_assessment_responses.sql` | Já criado | Respostas do assessment |

---

## Task 1: Instalar dependências

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Instalar react-force-graph e dependências de email**

```bash
cd /Users/thiagodalmoro/Documents/labuta-work/002-Tech/02-Agents/01-assessment-labuta
npm install react-force-graph resend @react-email/components
npm install --save-dev @types/three
```

- [ ] **Step 2: Verificar instalação**

```bash
node -e "require('react-force-graph'); console.log('ok')"
```

Expected: `ok`

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add react-force-graph, resend, react-email deps"
```

---

## Task 2: Migrations Supabase

> ⚠️ **CHECKPOINT MANUAL:** Após este task, peça ao usuário para rodar as migrations no SQL Editor do Supabase antes de continuar.

**Files:**
- `supabase/migrations/001_assessment_typologies.sql` (já criado)
- `supabase/migrations/002_assessment_narratives.sql` (já criado)
- `supabase/migrations/003_assessment_responses.sql` (já criado)

- [ ] **Step 1: Revisar migrations existentes**

```bash
cat supabase/migrations/001_assessment_typologies.sql
cat supabase/migrations/002_assessment_narratives.sql
cat supabase/migrations/003_assessment_responses.sql
```

- [ ] **Step 2: Solicitar ao usuário que rode as migrations**

Diga ao usuário:

> "Agora preciso que você rode as 3 migrations no SQL Editor do Supabase (Settings → SQL Editor). Cole e execute cada arquivo em ordem: 001, 002, 003. Confirme quando terminar."

- [ ] **Step 3: Commit das migrations**

```bash
git add supabase/
git commit -m "feat: add supabase migrations for redesign (typologies, narratives, responses)"
```

---

## Task 3: Tipos e definições de nós

**Files:**
- Replace: `src/lib/assessment/types.ts`
- Create: `src/lib/assessment/nodes.ts`
- Test: `__tests__/lib/assessment/nodes.test.ts`

- [ ] **Step 1: Substituir types.ts**

```typescript
// src/lib/assessment/types.ts
export type NodeSlug =
  | 'tomada-de-decisao'
  | 'papeis-e-responsabilidades'
  | 'comunicacao'
  | 'poder-e-influencia'
  | 'conflitos-entre-areas'
  | 'conversas-dificeis'
  | 'mudanca-e-adaptacao'
  | 'trabalho-invisivel'
  | 'ritos-e-reunioes'

export type ScaleResponse = 'sim' | 'um_pouco' | 'nao'

export const SCALE_WEIGHTS: Record<ScaleResponse, number> = {
  sim: 1.0,
  um_pouco: 0.5,
  nao: 0.0,
}

export interface AssessmentNode {
  slug: NodeSlug
  label: string
  color: string
}

export interface Narrative {
  id: string
  node_slug: NodeSlug
  seed_text: string
  variations: string[] | null
  tags: string[]
}

export interface NodeState {
  response: ScaleResponse | null
  selectedNarrativeIds: string[]
  freeInput: string
  tags: string[]
}

export interface SessionState {
  responseId: string | null
  nodeOrder: NodeSlug[]
  nodes: Partial<Record<NodeSlug, NodeState>>
}

export interface Tipologia {
  id: string
  nome: string
  descricao: string | null
  assinatura_nos: NodeSlug[]
  pontos_atencao: string[]
  cta: string | null
}

export interface AssessmentResponse {
  id: string
  created_at: string
  completed_at: string | null
  name: string | null
  email: string | null
  marketing_consent: boolean
  node_scores: Partial<Record<NodeSlug, number>> | null
  node_tags: Partial<Record<NodeSlug, string[]>> | null
  selected_narratives: Partial<Record<NodeSlug, string[]>> | null
  free_inputs: Partial<Record<NodeSlug, string>> | null
  tipologia_id: string | null
  leitura_sistemica: string | null
  graph_image_url: string | null
  result_shared: boolean
  result_email_sent: boolean
}
```

- [ ] **Step 2: Criar nodes.ts**

```typescript
// src/lib/assessment/nodes.ts
import type { AssessmentNode, NodeSlug } from './types'

export const ASSESSMENT_NODES: AssessmentNode[] = [
  { slug: 'tomada-de-decisao',         label: 'Tomada de decisão',         color: '#3355dd' },
  { slug: 'papeis-e-responsabilidades', label: 'Papéis e responsabilidades', color: '#DF4B19' },
  { slug: 'comunicacao',               label: 'Comunicação',               color: '#FAE063' },
  { slug: 'poder-e-influencia',         label: 'Poder e influência',         color: '#e07820' },
  { slug: 'conflitos-entre-areas',      label: 'Conflitos entre áreas',      color: '#9966dd' },
  { slug: 'conversas-dificeis',         label: 'Conversas difíceis',         color: '#f08898' },
  { slug: 'mudanca-e-adaptacao',        label: 'Mudança e adaptação',        color: '#2dd4bf' },
  { slug: 'trabalho-invisivel',         label: 'Trabalho invisível',         color: '#4ade80' },
  { slug: 'ritos-e-reunioes',           label: 'Ritos e reuniões',           color: '#38bdf8' },
]

export const NODE_MAP: Record<NodeSlug, AssessmentNode> = Object.fromEntries(
  ASSESSMENT_NODES.map(n => [n.slug, n])
) as Record<NodeSlug, AssessmentNode>

export const ALL_SLUGS: NodeSlug[] = ASSESSMENT_NODES.map(n => n.slug)
```

- [ ] **Step 3: Escrever teste**

```typescript
// __tests__/lib/assessment/nodes.test.ts
import { ASSESSMENT_NODES, NODE_MAP, ALL_SLUGS } from '@/lib/assessment/nodes'

describe('ASSESSMENT_NODES', () => {
  it('contém exatamente 9 nós', () => {
    expect(ASSESSMENT_NODES).toHaveLength(9)
  })

  it('todos os nós têm slug, label e cor', () => {
    for (const node of ASSESSMENT_NODES) {
      expect(node.slug).toBeTruthy()
      expect(node.label).toBeTruthy()
      expect(node.color).toMatch(/^#[0-9a-f]{6}$/i)
    }
  })

  it('NODE_MAP indexa todos os nós por slug', () => {
    expect(Object.keys(NODE_MAP)).toHaveLength(9)
    expect(NODE_MAP['comunicacao'].label).toBe('Comunicação')
  })

  it('ALL_SLUGS tem 9 slugs', () => {
    expect(ALL_SLUGS).toHaveLength(9)
  })
})
```

- [ ] **Step 4: Rodar teste**

```bash
npx jest __tests__/lib/assessment/nodes.test.ts --no-coverage
```

Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/assessment/types.ts src/lib/assessment/nodes.ts __tests__/lib/assessment/nodes.test.ts
git commit -m "feat: new assessment types and node definitions"
```

---

## Task 4: Scoring

**Files:**
- Replace: `src/lib/assessment/scoring.ts`
- Test: `__tests__/lib/assessment/scoring.test.ts`

- [ ] **Step 1: Escrever teste primeiro**

```typescript
// __tests__/lib/assessment/scoring.test.ts
import { calculateNodeScore, calculateNodeScores, getTopNodes } from '@/lib/assessment/scoring'
import type { SessionState } from '@/lib/assessment/types'

describe('calculateNodeScore', () => {
  it('retorna 1.0 para sim sem tags', () => {
    expect(calculateNodeScore('sim', [])).toBe(1.0)
  })

  it('retorna 0.5 para um_pouco sem tags', () => {
    expect(calculateNodeScore('um_pouco', [])).toBe(0.5)
  })

  it('retorna 0.0 para nao sem tags', () => {
    expect(calculateNodeScore('nao', [])).toBe(0.0)
  })

  it('retorna 0.0 para null', () => {
    expect(calculateNodeScore(null, [])).toBe(0.0)
  })

  it('adiciona boost por tags e mantém max 1.0', () => {
    const score = calculateNodeScore('sim', ['tag1', 'tag2'])
    expect(score).toBe(1.0) // capped
  })

  it('aplica boost em score parcial', () => {
    const score = calculateNodeScore('nao', ['tag1'])
    expect(score).toBeGreaterThan(0.0)
    expect(score).toBeLessThanOrEqual(1.0)
  })
})

describe('getTopNodes', () => {
  const scores = {
    'comunicacao': 0.8,
    'tomada-de-decisao': 1.0,
    'trabalho-invisivel': 0.5,
    'ritos-e-reunioes': 0.2,
  } as Parameters<typeof getTopNodes>[0]

  it('retorna os top 3 por score decrescente', () => {
    const top = getTopNodes(scores, 3)
    expect(top[0]).toBe('tomada-de-decisao')
    expect(top[1]).toBe('comunicacao')
    expect(top[2]).toBe('trabalho-invisivel')
  })

  it('respeita o parâmetro n', () => {
    expect(getTopNodes(scores, 2)).toHaveLength(2)
  })
})
```

- [ ] **Step 2: Rodar para confirmar falha**

```bash
npx jest __tests__/lib/assessment/scoring.test.ts --no-coverage
```

Expected: FAIL (module not found)

- [ ] **Step 3: Implementar scoring.ts**

```typescript
// src/lib/assessment/scoring.ts
import { SCALE_WEIGHTS } from './types'
import type { NodeSlug, ScaleResponse, SessionState } from './types'

const TAG_BOOST = 0.05

export function calculateNodeScore(
  response: ScaleResponse | null,
  tags: string[]
): number {
  if (!response) return 0.0
  const base = SCALE_WEIGHTS[response]
  const boost = tags.length > 0 ? TAG_BOOST : 0
  return Math.min(1.0, base + boost)
}

export function calculateNodeScores(
  session: SessionState
): Partial<Record<NodeSlug, number>> {
  const scores: Partial<Record<NodeSlug, number>> = {}
  for (const [slug, state] of Object.entries(session.nodes)) {
    if (state) {
      scores[slug as NodeSlug] = calculateNodeScore(state.response, state.tags)
    }
  }
  return scores
}

export function getTopNodes(
  scores: Partial<Record<NodeSlug, number>>,
  n = 3
): NodeSlug[] {
  return (Object.entries(scores) as [NodeSlug, number][])
    .sort(([, a], [, b]) => b - a)
    .slice(0, n)
    .map(([slug]) => slug)
}
```

- [ ] **Step 4: Rodar testes**

```bash
npx jest __tests__/lib/assessment/scoring.test.ts --no-coverage
```

Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/assessment/scoring.ts __tests__/lib/assessment/scoring.test.ts
git commit -m "feat: new scoring logic (sim/um_pouco/nao scale)"
```

---

## Task 5: Session Management

**Files:**
- Create: `src/lib/assessment/session.ts`
- Test: `__tests__/lib/assessment/session.test.ts`

- [ ] **Step 1: Escrever teste**

```typescript
// __tests__/lib/assessment/session.test.ts
import { initSession, updateNodeState, getNodeStep } from '@/lib/assessment/session'

describe('initSession', () => {
  it('cria sessão com 9 nós na ordem', () => {
    const s = initSession()
    expect(s.nodeOrder).toHaveLength(9)
    expect(s.nodes).toEqual({})
    expect(s.responseId).toBeNull()
  })

  it('randomiza a ordem a cada chamada', () => {
    const a = initSession().nodeOrder
    const b = initSession().nodeOrder
    // Com 9 nós a chance de ordem idêntica é 1/9! ≈ 0
    expect(a.join('')).not.toBe(b.join(''))
  })
})

describe('updateNodeState', () => {
  it('adiciona resposta a um nó', () => {
    const s = initSession()
    const updated = updateNodeState(s, 'comunicacao', { response: 'sim' })
    expect(updated.nodes['comunicacao']?.response).toBe('sim')
  })

  it('preserva estado anterior ao atualizar', () => {
    let s = initSession()
    s = updateNodeState(s, 'comunicacao', { response: 'sim', freeInput: 'texto' })
    s = updateNodeState(s, 'comunicacao', { tags: ['tag1'] })
    expect(s.nodes['comunicacao']?.response).toBe('sim')
    expect(s.nodes['comunicacao']?.freeInput).toBe('texto')
    expect(s.nodes['comunicacao']?.tags).toEqual(['tag1'])
  })
})

describe('getNodeStep', () => {
  it('retorna o índice do nó na ordem da sessão', () => {
    const s = initSession()
    const slug = s.nodeOrder[3]!
    expect(getNodeStep(s, slug)).toBe(3)
  })

  it('retorna -1 para slug inválido', () => {
    const s = initSession()
    expect(getNodeStep(s, 'nao-existe' as never)).toBe(-1)
  })
})
```

- [ ] **Step 2: Rodar para confirmar falha**

```bash
npx jest __tests__/lib/assessment/session.test.ts --no-coverage
```

Expected: FAIL

- [ ] **Step 3: Implementar session.ts**

```typescript
// src/lib/assessment/session.ts
import type { NodeSlug, ScaleResponse, SessionState } from './types'
import { ALL_SLUGS } from './nodes'

export const SESSION_KEY = 'labuta_assessment_v2'

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j]!, copy[i]!]
  }
  return copy
}

export function initSession(): SessionState {
  return { responseId: null, nodeOrder: shuffle(ALL_SLUGS), nodes: {} }
}

export function loadSession(): SessionState {
  if (typeof window === 'undefined') return initSession()
  const raw = localStorage.getItem(SESSION_KEY)
  if (!raw) return initSession()
  try {
    return JSON.parse(raw) as SessionState
  } catch {
    return initSession()
  }
}

export function saveSession(session: SessionState): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function clearSession(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(SESSION_KEY)
}

export function updateNodeState(
  session: SessionState,
  slug: NodeSlug,
  updates: Partial<{ response: ScaleResponse; freeInput: string; tags: string[]; selectedNarrativeIds: string[] }>
): SessionState {
  const updated: SessionState = {
    ...session,
    nodes: {
      ...session.nodes,
      [slug]: {
        response: null,
        selectedNarrativeIds: [],
        freeInput: '',
        tags: [],
        ...(session.nodes[slug] ?? {}),
        ...updates,
      },
    },
  }
  saveSession(updated)
  return updated
}

export function getNodeStep(session: SessionState, slug: NodeSlug): number {
  return session.nodeOrder.indexOf(slug)
}
```

- [ ] **Step 4: Rodar testes**

```bash
npx jest __tests__/lib/assessment/session.test.ts --no-coverage
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/assessment/session.ts __tests__/lib/assessment/session.test.ts
git commit -m "feat: session management with localStorage"
```

---

## Task 6: Supabase Response Helpers

**Files:**
- Create: `src/lib/supabase/responses.ts`

- [ ] **Step 1: Criar responses.ts**

```typescript
// src/lib/supabase/responses.ts
import { createClient } from '@supabase/supabase-js'
import type { AssessmentResponse, Narrative, Tipologia, NodeSlug } from '@/lib/assessment/types'

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function createResponse(): Promise<string> {
  const supabase = serviceClient()
  const { data, error } = await supabase
    .from('assessment_responses')
    .insert({})
    .select('id')
    .single()
  if (error || !data) throw new Error(`Failed to create response: ${error?.message}`)
  return data.id as string
}

export async function updateResponse(
  id: string,
  patch: Partial<Omit<AssessmentResponse, 'id' | 'created_at'>>
): Promise<void> {
  const supabase = serviceClient()
  const { error } = await supabase
    .from('assessment_responses')
    .update(patch)
    .eq('id', id)
  if (error) throw new Error(`Failed to update response: ${error.message}`)
}

export async function getResponse(id: string): Promise<AssessmentResponse | null> {
  const supabase = serviceClient()
  const { data, error } = await supabase
    .from('assessment_responses')
    .select('*')
    .eq('id', id)
    .single()
  if (error || !data) return null
  return data as AssessmentResponse
}

export async function getNarrativesForNode(nodeSlug: NodeSlug): Promise<Narrative[]> {
  const supabase = serviceClient()
  const { data, error } = await supabase
    .from('assessment_narratives')
    .select('*')
    .eq('node_slug', nodeSlug)
  if (error || !data) return []
  return data as Narrative[]
}

export async function getTipologiaBySignature(
  topNodes: NodeSlug[]
): Promise<Tipologia | null> {
  const supabase = serviceClient()
  // Busca tipologia onde assinatura_nos contém os top nós (match parcial)
  const { data, error } = await supabase
    .from('assessment_typologies')
    .select('*')
  if (error || !data) return null

  // Score de compatibilidade: quantidade de nós em common com assinatura
  const scored = (data as Tipologia[]).map(t => ({
    tipologia: t,
    score: t.assinatura_nos.filter(n => topNodes.includes(n)).length,
  }))
  const best = scored.sort((a, b) => b.score - a.score)[0]
  return best && best.score > 0 ? best.tipologia : null
}

export async function getAllTipologias(): Promise<Tipologia[]> {
  const supabase = serviceClient()
  const { data, error } = await supabase.from('assessment_typologies').select('*')
  if (error || !data) return []
  return data as Tipologia[]
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/supabase/responses.ts
git commit -m "feat: supabase response helpers"
```

---

## Task 7: ForceGraph Component

**Files:**
- Create: `src/components/grafo/ForceGraph.tsx`

> Nota: `react-force-graph-2d` usa canvas e depende do browser — deve ser carregado com `dynamic(..., { ssr: false })`.

- [ ] **Step 1: Criar ForceGraph.tsx**

```tsx
// src/components/grafo/ForceGraph.tsx
'use client'

import dynamic from 'next/dynamic'
import { useMemo } from 'react'
import type { SessionState, NodeSlug } from '@/lib/assessment/types'
import { ASSESSMENT_NODES } from '@/lib/assessment/nodes'

const ForceGraph2D = dynamic(
  () => import('react-force-graph').then(m => m.ForceGraph2D as React.ComponentType<ForceGraph2DProps>),
  { ssr: false }
)

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
  nodeCanvasObject?: (node: GNode, ctx: CanvasRenderingContext2D, globalScale: number) => void
  nodeCanvasObjectMode?: () => string
  linkColor?: (link: GLink) => string
  linkWidth?: (link: GLink) => number
  onNodeClick?: (node: GNode) => void
  ref?: React.Ref<{ toBase64Image: () => string }>
}

export interface ForceGraphProps {
  session: SessionState
  activeSlug: NodeSlug | null
  width?: number
  height?: number
  onNodeClick?: (slug: NodeSlug) => void
  graphRef?: React.Ref<{ toBase64Image: () => string }>
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
        nodeCanvasObject={(node, ctx) => {
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
        linkColor={(link) => `rgba(255,255,255,${link.strength * 0.4})`}
        linkWidth={(link) => link.strength * 2}
        onNodeClick={(node) => onNodeClick?.(node.id)}
      />
    </div>
  )
}
```

- [ ] **Step 2: Verificar que não há erros de tipo**

```bash
npx tsc --noEmit --project tsconfig.json 2>&1 | head -30
```

Expected: sem erros relacionados a ForceGraph.tsx

- [ ] **Step 3: Commit**

```bash
git add src/components/grafo/ForceGraph.tsx
git commit -m "feat: ForceGraph component (react-force-graph-2d, dark canvas)"
```

---

## Task 8: NarrativaPanel

**Files:**
- Replace: `src/components/grafo/NarrativaPanel.tsx`

Este componente recebe narrativas do Supabase (via prop), exibe 3 sorteadas, a escala Sim/Um pouco/Não, e o campo de input livre.

- [ ] **Step 1: Substituir NarrativaPanel.tsx**

```tsx
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
        {narratives.map((n, i) => (
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
```

- [ ] **Step 2: Commit**

```bash
git add src/components/grafo/NarrativaPanel.tsx
git commit -m "feat: NarrativaPanel with sim/um_pouco/nao scale and free input"
```

---

## Task 9: Assessment Step Pages

**Files:**
- Replace: `src/app/assessment/page.tsx`
- Create: `src/app/assessment/[step]/page.tsx`

- [ ] **Step 1: Substituir assessment/page.tsx (redireciona para step 0)**

```tsx
// src/app/assessment/page.tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { loadSession, initSession, saveSession } from '@/lib/assessment/session'

export default function AssessmentPage() {
  const router = useRouter()

  useEffect(() => {
    let session = loadSession()
    // Se não tem nodeOrder (sessão nova ou corrompida), reinicia
    if (!session.nodeOrder?.length) {
      session = initSession()
      saveSession(session)
    }
    router.replace('/assessment/0')
  }, [router])

  return (
    <main className="min-h-screen flex items-center justify-center" style={{ background: '#0e0e12' }}>
      <div className="text-gray-500 text-sm">Carregando…</div>
    </main>
  )
}
```

- [ ] **Step 2: Criar assessment/[step]/page.tsx**

```tsx
// src/app/assessment/[step]/page.tsx
'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ForceGraph } from '@/components/grafo/ForceGraph'
import { NarrativaPanel } from '@/components/grafo/NarrativaPanel'
import { loadSession, saveSession, updateNodeState } from '@/lib/assessment/session'
import { ASSESSMENT_NODES, NODE_MAP } from '@/lib/assessment/nodes'
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
  const [narratives, setNarratives] = useState<Narrative[]>([])
  const [sampledNarratives, setSampledNarratives] = useState<Narrative[]>([])
  const [taggingTimeout, setTaggingTimeout] = useState<NodeJS.Timeout | null>(null)

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
        setNarratives(data)
        setSampledNarratives(sampleNarratives(data))
      })
      .catch(() => setNarratives([]))
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
```

- [ ] **Step 3: Criar API route para narrativas**

```typescript
// src/app/api/assessment/narratives/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getNarrativesForNode } from '@/lib/supabase/responses'
import type { NodeSlug } from '@/lib/assessment/types'

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug') as NodeSlug | null
  if (!slug) return NextResponse.json([], { status: 400 })
  const narratives = await getNarrativesForNode(slug)
  return NextResponse.json(narratives)
}
```

- [ ] **Step 4: Verificar tipos**

```bash
npx tsc --noEmit 2>&1 | grep -E "error|Error" | head -20
```

Expected: sem erros nas novas rotas

- [ ] **Step 5: Commit**

```bash
git add src/app/assessment/page.tsx src/app/assessment/[step]/ src/app/api/assessment/narratives/
git commit -m "feat: sequential assessment steps with force graph"
```

---

## Task 10: Claude Tagging API

**Files:**
- Create: `src/lib/ai/tagging.ts`
- Create: `src/app/api/assessment/tags/route.ts`

- [ ] **Step 1: Criar tagging.ts**

```typescript
// src/lib/ai/tagging.ts
import Anthropic from '@anthropic-ai/sdk'
import { ALL_SLUGS } from '@/lib/assessment/nodes'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const VALID_TAGS = ALL_SLUGS.map(s => s.replace(/-/g, '_'))

export async function classifyTags(text: string): Promise<string[]> {
  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 100,
    messages: [
      {
        role: 'user',
        content: `Classifique o texto abaixo com 1 a 3 tags do vocabulário: ${VALID_TAGS.join(', ')}.
Responda APENAS com as tags separadas por vírgula, sem explicação.
Texto: "${text}"`,
      },
    ],
  })

  const raw = message.content[0]?.type === 'text' ? message.content[0].text : ''
  return raw
    .split(',')
    .map(t => t.trim())
    .filter(t => VALID_TAGS.includes(t))
}
```

- [ ] **Step 2: Criar API route**

```typescript
// src/app/api/assessment/tags/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { classifyTags } from '@/lib/ai/tagging'

const Schema = z.object({ text: z.string().min(1).max(500) })

export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsed = Schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ tags: [] }, { status: 400 })
  try {
    const tags = await classifyTags(parsed.data.text)
    return NextResponse.json({ tags })
  } catch {
    return NextResponse.json({ tags: [] })
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/ai/tagging.ts src/app/api/assessment/tags/
git commit -m "feat: claude haiku tag classification for free input"
```

---

## Task 11: Gate + Submit API

**Files:**
- Replace: `src/app/assessment/gate/page.tsx`
- Replace: `src/app/api/assessment/submit/route.ts`

- [ ] **Step 1: Substituir gate/page.tsx**

```tsx
// src/app/assessment/gate/page.tsx
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
  const graphRef = useRef<{ toBase64Image: () => string }>(null)

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
      const graphImage = graphRef.current?.toBase64Image() ?? null

      const res = await fetch('/api/assessment/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, marketing_consent: consent, session, graphImage }),
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

  return (
    <main className="min-h-screen relative flex items-center justify-center px-4"
      style={{ background: '#0e0e12' }}>

      {/* Grafo ao fundo, desfocado */}
      <div className="absolute inset-0 flex items-center justify-center opacity-30 blur-sm pointer-events-none">
        <ForceGraph session={session} activeSlug={null} width={600} height={600} />
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
```

- [ ] **Step 2: Substituir submit/route.ts**

```typescript
// src/app/api/assessment/submit/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { calculateNodeScores, getTopNodes } from '@/lib/assessment/scoring'
import { getTipologiaBySignature, updateResponse } from '@/lib/supabase/responses'
import { sendResultEmail } from '@/lib/email/resend'
import type { SessionState } from '@/lib/assessment/types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const SubmitSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  marketing_consent: z.boolean().default(false),
  session: z.object({
    responseId: z.string().nullable(),
    nodeOrder: z.array(z.string()),
    nodes: z.record(z.any()),
  }),
  graphImage: z.string().nullable().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = SubmitSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    const { name, email, marketing_consent, session, graphImage } = parsed.data
    const typedSession = session as SessionState

    // 1. Calcular scores
    const nodeScores = calculateNodeScores(typedSession)
    const topNodes = getTopNodes(nodeScores, 3)
    const nodeTags = Object.fromEntries(
      Object.entries(typedSession.nodes).map(([slug, state]) => [slug, state?.tags ?? []])
    )
    const freeInputs = Object.fromEntries(
      Object.entries(typedSession.nodes).map(([slug, state]) => [slug, state?.freeInput ?? ''])
    )
    const selectedNarratives = Object.fromEntries(
      Object.entries(typedSession.nodes).map(([slug, state]) => [slug, state?.selectedNarrativeIds ?? []])
    )

    // 2. Buscar tipologia
    const tipologia = await getTipologiaBySignature(topNodes)

    // 3. Salvar imagem do grafo no Storage (se fornecida)
    let graphImageUrl: string | null = null
    if (graphImage) {
      const base64Data = graphImage.replace(/^data:image\/\w+;base64,/, '')
      const buffer = Buffer.from(base64Data, 'base64')
      const filename = `graphs/${Date.now()}-${Math.random().toString(36).slice(2)}.png`
      const { error: uploadError } = await supabase.storage
        .from('assessment-graphs')
        .upload(filename, buffer, { contentType: 'image/png', upsert: false })
      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage.from('assessment-graphs').getPublicUrl(filename)
        graphImageUrl = publicUrl
      }
    }

    // 4. Salvar response completa
    const { data, error } = await supabase
      .from('assessment_responses')
      .insert({
        name,
        email,
        marketing_consent,
        node_scores: nodeScores,
        node_tags: nodeTags,
        selected_narratives: selectedNarratives,
        free_inputs: freeInputs,
        tipologia_id: tipologia?.id ?? null,
        graph_image_url: graphImageUrl,
        completed_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Erro ao salvar resultado' }, { status: 500 })
    }

    const resultId = data.id as string
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'

    // 5. Enviar email em background
    sendResultEmail({
      to: email,
      name,
      resultId,
      graphImageUrl,
      resultUrl: `${baseUrl}/assessment/result/${resultId}`,
    }).catch(err => console.error('Email error (non-blocking):', err))

    return NextResponse.json({ id: resultId })
  } catch (err) {
    console.error('Submit error:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/assessment/gate/ src/app/api/assessment/submit/
git commit -m "feat: gate page with blurred graph bg + updated submit API"
```

---

## Task 12: Leitura Sistêmica (Streaming)

**Files:**
- Create: `src/lib/ai/leitura.ts`
- Create: `src/app/api/assessment/leitura/route.ts`

- [ ] **Step 1: Criar leitura.ts**

```typescript
// src/lib/ai/leitura.ts
import Anthropic from '@anthropic-ai/sdk'
import type { NodeSlug } from '@/lib/assessment/types'
import { NODE_MAP } from '@/lib/assessment/nodes'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface LeituraInput {
  nodeScores: Partial<Record<NodeSlug, number>>
  nodeTags: Partial<Record<NodeSlug, string[]>>
  tipologiaNome: string | null
}

export function buildLeituraPrompt(input: LeituraInput): string {
  const lines = (Object.entries(input.nodeScores) as [NodeSlug, number][])
    .sort(([, a], [, b]) => b - a)
    .map(([slug, score]) => {
      const node = NODE_MAP[slug]
      const tags = input.nodeTags[slug] ?? []
      const tagsStr = tags.length ? ` (tags: ${tags.join(', ')})` : ''
      return `- ${node.label}: ${(score * 100).toFixed(0)}%${tagsStr}`
    })
    .join('\n')

  return `Padrão de ativação:\n${lines}\n\nTipologia sugerida: ${input.tipologiaNome ?? 'não identificada'}\n\nGere a leitura sistêmica.`
}

export async function* streamLeitura(input: LeituraInput): AsyncIterable<string> {
  const systemPrompt = process.env.LABUTA_ORG_DESIGNER_PROMPT ?? 'Você é um designer organizacional da Labuta Labs. Gere uma leitura sistêmica direta, sem jargão, em primeira pessoa do plural, baseada no padrão de ativação do assessment.'

  const stream = await client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 800,
    system: systemPrompt,
    messages: [{ role: 'user', content: buildLeituraPrompt(input) }],
  })

  for await (const event of stream) {
    if (
      event.type === 'content_block_delta' &&
      event.delta.type === 'text_delta'
    ) {
      yield event.delta.text
    }
  }
}
```

- [ ] **Step 2: Criar API route de streaming**

```typescript
// src/app/api/assessment/leitura/route.ts
import { NextRequest } from 'next/server'
import { getResponse } from '@/lib/supabase/responses'
import { streamLeitura } from '@/lib/ai/leitura'
import type { NodeSlug } from '@/lib/assessment/types'
import { getAllTipologias } from '@/lib/supabase/responses'

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return new Response('Missing id', { status: 400 })

  const response = await getResponse(id)
  if (!response) return new Response('Not found', { status: 404 })

  // Se leitura já foi gerada e salva, retornar direto
  if (response.leitura_sistemica) {
    return new Response(response.leitura_sistemica, {
      headers: { 'Content-Type': 'text/plain' },
    })
  }

  let tipologiaNome: string | null = null
  if (response.tipologia_id) {
    const tipologias = await getAllTipologias()
    tipologiaNome = tipologias.find(t => t.id === response.tipologia_id)?.nome ?? null
  }

  const encoder = new TextEncoder()
  let fullText = ''

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of streamLeitura({
          nodeScores: (response.node_scores ?? {}) as Partial<Record<NodeSlug, number>>,
          nodeTags: (response.node_tags ?? {}) as Partial<Record<NodeSlug, string[]>>,
          tipologiaNome,
        })) {
          fullText += chunk
          controller.enqueue(encoder.encode(chunk))
        }

        // Salvar leitura gerada no Supabase
        const { updateResponse } = await import('@/lib/supabase/responses')
        await updateResponse(id, { leitura_sistemica: fullText }).catch(() => {})

        controller.close()
      } catch (err) {
        controller.error(err)
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
    },
  })
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/ai/leitura.ts src/app/api/assessment/leitura/
git commit -m "feat: streaming leitura sistêmica via Claude sonnet"
```

---

## Task 13: Página de Resultado

**Files:**
- Replace: `src/app/assessment/result/[id]/page.tsx`
- Create: `src/components/resultado/TipologiaTabs.tsx`
- Update: `src/components/resultado/LeituraSistemica.tsx`

- [ ] **Step 1: Criar TipologiaTabs.tsx**

```tsx
// src/components/resultado/TipologiaTabs.tsx
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
```

- [ ] **Step 2: Atualizar LeituraSistemica.tsx para suporte a streaming**

```tsx
// src/components/resultado/LeituraSistemica.tsx
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
```

- [ ] **Step 3: Substituir result/[id]/page.tsx**

```tsx
// src/app/assessment/result/[id]/page.tsx
import { notFound } from 'next/navigation'
import { getResponse, getAllTipologias } from '@/lib/supabase/responses'
import { ForceGraph } from '@/components/grafo/ForceGraph'
import { LeituraSistemica } from '@/components/resultado/LeituraSistemica'
import { TipologiaTabs } from '@/components/resultado/TipologiaTabs'
import { initSession } from '@/lib/assessment/session'
import type { SessionState, NodeSlug } from '@/lib/assessment/types'

function responseToSession(response: Awaited<ReturnType<typeof getResponse>>): SessionState {
  if (!response) return initSession()
  const nodes: SessionState['nodes'] = {}
  const scores = response.node_scores ?? {}
  const tags = response.node_tags ?? {}
  const inputs = response.free_inputs ?? {}
  const narratives = response.selected_narratives ?? {}

  for (const slug of Object.keys(scores) as NodeSlug[]) {
    const score = scores[slug] ?? 0
    nodes[slug] = {
      response: score >= 0.9 ? 'sim' : score >= 0.4 ? 'um_pouco' : 'nao',
      selectedNarrativeIds: narratives[slug] ?? [],
      freeInput: inputs[slug] ?? '',
      tags: tags[slug] ?? [],
    }
  }

  return { responseId: response.id, nodeOrder: Object.keys(scores) as NodeSlug[], nodes }
}

export default async function ResultPage({ params }: { params: { id: string } }) {
  const response = await getResponse(params.id)
  if (!response) notFound()

  const allTipologias = await getAllTipologias()
  const recommended = allTipologias.find(t => t.id === response.tipologia_id) ?? null
  const session = responseToSession(response)
  const firstName = response.name?.split(' ')[0] ?? null

  return (
    <main className="min-h-screen" style={{ background: '#0e0e12' }}>
      <div className="max-w-3xl mx-auto px-4 py-12 flex flex-col gap-8">
        {/* Header */}
        <div className="text-center">
          <p className="text-purple-400 font-bold text-xs tracking-widest uppercase mb-2">LABUTA LABS</p>
          <h1 className="text-2xl font-bold text-white">
            {firstName ? `Seu mapa, ${firstName}` : 'Seu mapa organizacional'}
          </h1>
        </div>

        {/* Grafo */}
        <ForceGraph session={session} activeSlug={null} width={640} height={420} />

        {/* Leitura sistêmica (streaming) */}
        <LeituraSistemica
          responseId={response.id}
          initialText={response.leitura_sistemica}
        />

        {/* Tipologias */}
        {allTipologias.length > 0 && (
          <TipologiaTabs tipologias={allTipologias} recommended={recommended} />
        )}

        {/* CTA */}
        <div className="rounded-2xl border border-white/10 p-8 text-center flex flex-col gap-4 bg-white/5">
          <h2 className="text-xl font-bold text-white">Isso ressou com algo que você está vivendo?</h2>
          <p className="text-gray-400 text-sm max-w-md mx-auto leading-relaxed">
            A Labuta trabalha com organizações explorando esses pontos de alavancagem
            através de experimentos estruturados — não consultoria tradicional.
          </p>
          <a
            href="https://labuta.com/contato"
            className="bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-purple-500 transition-colors text-sm inline-block"
          >
            Conversar com a Labuta →
          </a>
        </div>
      </div>
    </main>
  )
}
```

- [ ] **Step 4: Verificar tipos**

```bash
npx tsc --noEmit 2>&1 | grep -E "error TS" | head -20
```

- [ ] **Step 5: Commit**

```bash
git add src/app/assessment/result/ src/components/resultado/TipologiaTabs.tsx src/components/resultado/LeituraSistemica.tsx
git commit -m "feat: result page with tabs, streaming leitura, dark theme"
```

---

## Task 14: Email (Resend + React Email)

**Files:**
- Create: `src/lib/email/result-template.tsx`
- Replace: `src/lib/email/resend.ts`

- [ ] **Step 1: Criar result-template.tsx**

```tsx
// src/lib/email/result-template.tsx
import {
  Html, Head, Body, Container, Section,
  Text, Button, Img, Hr,
} from '@react-email/components'

interface ResultEmailProps {
  name: string
  resultUrl: string
  graphImageUrl: string | null
}

export function ResultEmail({ name, resultUrl, graphImageUrl }: ResultEmailProps) {
  const firstName = name.split(' ')[0]
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: '#0e0e12', fontFamily: 'sans-serif' }}>
        <Container style={{ maxWidth: 560, margin: '0 auto', padding: '40px 20px' }}>
          <Text style={{ color: '#a855f7', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase' }}>
            LABUTA LABS
          </Text>

          <Text style={{ color: '#ffffff', fontSize: 22, fontWeight: 'bold', margin: '16px 0 8px' }}>
            {firstName ? `Seu mapa, ${firstName}.` : 'Seu mapa organizacional.'}
          </Text>

          <Text style={{ color: '#9ca3af', fontSize: 14, lineHeight: 1.6 }}>
            O seu grafo de pontos de alavancagem está pronto.
          </Text>

          {graphImageUrl && (
            <Section style={{ margin: '24px 0' }}>
              <Img
                src={graphImageUrl}
                alt="Seu grafo organizacional"
                width={520}
                style={{ borderRadius: 16, display: 'block' }}
              />
            </Section>
          )}

          <Button
            href={resultUrl}
            style={{
              backgroundColor: '#7c3aed',
              color: '#ffffff',
              padding: '14px 28px',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 'bold',
              textDecoration: 'none',
              display: 'inline-block',
              margin: '8px 0 24px',
            }}
          >
            Ver resultado completo →
          </Button>

          <Hr style={{ borderColor: '#1f2937' }} />

          <Text style={{ color: '#4b5563', fontSize: 12 }}>
            Labuta Labs · Sem spam, só leituras que podem ser úteis.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
```

- [ ] **Step 2: Substituir resend.ts**

```typescript
// src/lib/email/resend.ts
import { Resend } from 'resend'
import { ResultEmail } from './result-template'

const resend = new Resend(process.env.RESEND_API_KEY)

interface SendResultEmailParams {
  to: string
  name: string
  resultId: string
  graphImageUrl: string | null
  resultUrl: string
}

export async function sendResultEmail({
  to,
  name,
  resultId,
  graphImageUrl,
  resultUrl,
}: SendResultEmailParams): Promise<void> {
  await resend.emails.send({
    from: 'Labuta Labs <noreply@labuta.com>',
    to,
    subject: 'Seu mapa organizacional está pronto',
    react: ResultEmail({ name, resultUrl, graphImageUrl }),
  })
}
```

- [ ] **Step 3: Verificar que RESEND_API_KEY está no .env.local**

```bash
grep RESEND_API_KEY .env.local 2>/dev/null || echo "ATENÇÃO: RESEND_API_KEY não encontrada em .env.local"
```

Se não encontrada, adicionar ao `.env.local`:
```
RESEND_API_KEY=re_xxxxxxxxxxxx
```

> **Checkpoint:** Peça ao usuário a RESEND_API_KEY antes de testar o email.

- [ ] **Step 4: Commit**

```bash
git add src/lib/email/
git commit -m "feat: react email template + resend integration"
```

---

## Task 15: Seed de Dados + Verificação Final

**Files:**
- Create: `supabase/seeds/001_narratives.sql`
- Create: `supabase/seeds/002_typologies.sql`

- [ ] **Step 1: Criar seed de narrativas**

```sql
-- supabase/seeds/001_narratives.sql
-- Seeds iniciais para o nó Trabalho Invisível
INSERT INTO assessment_narratives (node_slug, seed_text, tags) VALUES
('trabalho-invisivel', 'Se a gente não aciona, não acontece. Fomos virando a ponte entre áreas que deveriam se conversar sozinhas.', ARRAY['trabalho_invisivel', 'papeis_e_responsabilidades']),
('trabalho-invisivel', 'Quando falta peça na estrutura, quem está mais perto do buraco vai tapando. Fico tão dentro do operacional que perco a visão do sistema de fora — que era exatamente o meu papel.', ARRAY['papeis_e_responsabilidades', 'trabalho_invisivel', 'tomada_de_decisao']);

-- Adicione seeds para os outros nós conforme forem escritas
```

- [ ] **Step 2: Criar seed de tipologias**

```sql
-- supabase/seeds/002_typologies.sql
INSERT INTO assessment_typologies (nome, descricao, assinatura_nos, pontos_atencao, cta) VALUES
('O Sistema Travado', 'Decisões circulam sem chegar a lugar nenhum. O poder está concentrado, os conflitos são evitados, e o sistema se auto-perpetua.', ARRAY['tomada-de-decisao', 'poder-e-influencia', 'conflitos-entre-areas'], ARRAY['Quem realmente toma decisões aqui?', 'O que acontece quando alguém discorda?', 'Como o poder está distribuído formalmente vs informalmente?'], 'Vamos mapear onde o sistema está travado.'),
('A Organização Silenciosa', 'Muito trabalho acontece nos bastidores. As responsabilidades estão difusas, a comunicação é informal, e quem sustenta o sistema raramente é reconhecido.', ARRAY['comunicacao', 'trabalho-invisivel', 'papeis-e-responsabilidades'], ARRAY['Quem sustenta o sistema invisível?', 'O que você faz que ninguém vê?', 'O que aconteceria se essas pessoas parassem?'], 'Vamos tornar o invisível visível.'),
('Em Transição', 'A organização está mudando, mas ainda não sabe como. Conversas difíceis estão represadas, ritos estão desatualizados, e a adaptação acontece de forma desigual.', ARRAY['mudanca-e-adaptacao', 'conversas-dificeis', 'ritos-e-reunioes'], ARRAY['O que mudou mas ainda não foi nomeado?', 'Quais conversas estão sendo evitadas?', 'Quais ritos ainda fazem sentido?'], 'Vamos trabalhar a transição juntos.');
```

- [ ] **Step 3: Rodar todos os testes**

```bash
npx jest --no-coverage
```

Expected: PASS em todos os testes

- [ ] **Step 4: Type check final**

```bash
npx tsc --noEmit
```

Expected: 0 erros

- [ ] **Step 5: Commit final**

```bash
git add supabase/seeds/
git commit -m "feat: assessment seeds (narratives + typologies)"
```

---

## Checklist de Variáveis de Ambiente

Verificar que `.env.local` contém:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
RESEND_API_KEY=
NEXT_PUBLIC_BASE_URL=http://localhost:3000
LABUTA_ORG_DESIGNER_PROMPT=  # opcional — usa fallback se vazio
```

---

## Checkpoints Manuais

| Momento | Ação necessária |
|---|---|
| Antes do Task 3 | Rodar migrations 001, 002, 003 no SQL Editor do Supabase |
| Antes do Task 14 | Confirmar RESEND_API_KEY em .env.local |
| Após Task 14 | Inserir seeds 001 e 002 no SQL Editor do Supabase |
| Final | Testar fluxo completo: landing → steps → gate → resultado → email |

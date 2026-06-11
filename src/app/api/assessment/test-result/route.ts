// Endpoint apenas para desenvolvimento — gera um resultado de teste sem passar pelo gate
// Remove em produção ou proteja com env check
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getTipologiaBySignature } from '@/lib/supabase/responses'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Leitura mock — usada em dev para não chamar a Claude API a cada teste
const MOCK_LEITURA = `# Leitura Sistêmica — Labuta Labs

---

## O que o padrão está dizendo

Três temas chegaram no limite máximo ao mesmo tempo: **carga de trabalho, tomada de decisão e capacidade de mudar**. Quando os três disparam juntos assim, raramente é coincidência. Eles se alimentam mutuamente.

A sobrecarga não vem só do volume de tarefas. Ela vem de decisões que não fecham, de mudanças que não terminam e de um sistema que pede adaptação constante sem oferecer clareza sobre quem decide o quê. As pessoas não estão apenas cansadas de trabalhar — estão cansadas de trabalhar sem ver as coisas resolverem.

---

## O que está embaixo da superfície

A comunicação e o poder aparecem em segundo plano, ambos relevantes. Isso nos diz algo importante: **a informação circula de forma desigual, e isso está conectado a quem tem influência**. Não é que as pessoas não se comunicam — é que a comunicação relevante não chega para quem precisa dela, ou chega tarde, ou chega filtrada.

O trabalho invisível e os conflitos entre áreas estão presentes, mas não explodiram. Isso sugere que **o problema não é guerra aberta entre times** — é uma tensão crônica, de baixa intensidade, onde cada área carrega coisas que ninguém vê e sente que o outro lado não reconhece o esforço.

---

## O que ainda não veio à tona

Conversas difíceis chegaram a zero. Reuniões e papéis chegaram baixo. Isso merece atenção porque **não significa que esses temas estão bem** — significa que ainda não viraram assunto. As pessoas sabem que certas conversas precisam acontecer, mas o ambiente ainda não deu sinal de que é seguro tê-las.

---

## Como lemos esse conjunto

Este é um sistema sob pressão acumulada. A carga é real, mas o que a mantém alta é estrutural: **decisões que circulam sem resolver, mudanças que se sobrepõem antes de assentar, e pouca clareza sobre quem tem autoridade para fechar o quê**.

---

## Por onde começar

A pergunta central que esse padrão coloca é: **quem tem autoridade para decidir o quê, e isso está claro para todo mundo?**

Enquanto essa pergunta não tiver resposta explícita, a sobrecarga vai continuar porque as pessoas vão continuar compensando com esforço o que deveria ser resolvido com estrutura.`

// Sessão realista: cada nó com tags diferentes para mostrar conexões variadas
const TEST_SESSION = {
  nodeOrder: [
    'tomada-de-decisao', 'poder-e-influencia', 'conflitos-entre-areas',
    'comunicacao', 'trabalho-invisivel', 'papeis-e-responsabilidades',
    'mudanca-e-adaptacao', 'conversas-dificeis', 'ritos-e-reunioes', 'sobrecarga',
  ],
  nodes: {
    'tomada-de-decisao':     { narrativeResponses: { 'a': 'sim', 'b': 'sim' },    customNarratives: [], shownNarrativeIds: ['a','b'], activatedTags: ['decisao', 'poder', 'hierarquia'] },
    'poder-e-influencia':    { narrativeResponses: { 'c': 'sim', 'd': 'um_pouco' }, customNarratives: [], shownNarrativeIds: ['c','d'], activatedTags: ['poder', 'hierarquia', 'influencia'] },
    'conflitos-entre-areas': { narrativeResponses: { 'e': 'sim' },                customNarratives: [], shownNarrativeIds: ['e'],     activatedTags: ['conflito', 'alinhamento'] },
    'comunicacao':           { narrativeResponses: { 'f': 'um_pouco', 'g': 'sim' }, customNarratives: [], shownNarrativeIds: ['f','g'], activatedTags: ['clareza', 'alinhamento', 'informacao'] },
    'trabalho-invisivel':    { narrativeResponses: { 'h': 'sim' },                customNarratives: [], shownNarrativeIds: ['h'],     activatedTags: ['reconhecimento', 'esforco'] },
    'papeis-e-responsabilidades': { narrativeResponses: { 'i': 'nao', 'j': 'um_pouco' }, customNarratives: [], shownNarrativeIds: ['i','j'], activatedTags: ['clareza'] },
    'mudanca-e-adaptacao':   { narrativeResponses: { 'k': 'sim', 'l': 'sim' },   customNarratives: [], shownNarrativeIds: ['k','l'], activatedTags: ['mudanca', 'resistencia', 'incerteza'] },
    'conversas-dificeis':    { narrativeResponses: { 'm': 'nao' },                customNarratives: [], shownNarrativeIds: ['m'],     activatedTags: [] },
    'ritos-e-reunioes':      { narrativeResponses: { 'n': 'um_pouco' },           customNarratives: [], shownNarrativeIds: ['n'],     activatedTags: ['reuniao', 'rotina'] },
    'sobrecarga':            { narrativeResponses: { 'o': 'sim', 'p': 'sim' },    customNarratives: [], shownNarrativeIds: ['o','p'], activatedTags: ['carga', 'volume', 'burnout'] },
  },
}

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  // Calcular scores
  const nodeScores: Record<string, number> = {}
  for (const [slug, state] of Object.entries(TEST_SESSION.nodes)) {
    let sum = 0
    for (const r of Object.values(state.narrativeResponses)) {
      sum += r === 'sim' ? 1 : r === 'um_pouco' ? 0.5 : 0
    }
    nodeScores[slug] = sum
  }

  const topNodes = Object.entries(nodeScores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([slug]) => slug) as string[]

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tipologia = await getTipologiaBySignature(topNodes as any)
  console.log('[test-result] topNodes:', topNodes)
  console.log('[test-result] tipologia encontrada:', tipologia?.nome ?? 'null')

  const nodeTags = Object.fromEntries(
    Object.entries(TEST_SESSION.nodes).map(([slug, state]) => [slug, state.activatedTags])
  )
  const selectedNarratives = Object.fromEntries(
    Object.entries(TEST_SESSION.nodes).map(([slug, state]) => [slug, Object.keys(state.narrativeResponses)])
  )

  const { data, error } = await supabase
    .from('assessment_responses')
    .insert({
      name: 'Teste Dev',
      email: 'dev@labuta.com',
      marketing_consent: false,
      node_scores: nodeScores,
      node_tags: nodeTags,
      selected_narratives: selectedNarratives,
      free_inputs: {},
      tipologia_id: tipologia?.id ?? null,
      completed_at: new Date().toISOString(),
      leitura_sistemica: MOCK_LEITURA,
    })
    .select('id')
    .single()

  if (error || !data) {
    return NextResponse.json({ error: error?.message }, { status: 500 })
  }

  return NextResponse.redirect(
    new URL(`/assessment/result/${data.id}`, 'http://localhost:3001')
  )
}

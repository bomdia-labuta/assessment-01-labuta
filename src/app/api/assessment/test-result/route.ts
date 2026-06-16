// Endpoint apenas para desenvolvimento — gera um resultado de teste sem passar pelo gate
// Remove em produção ou proteja com env check
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Relatório mock estruturado — usado em dev para não chamar a Claude API a cada teste
const MOCK_RELATORIO = {
  leituraSistema: {
    eventos: 'Reuniões que terminam sem encaminhar nada, decisões que circulam sem fechar e uma carga de trabalho que se mantém alta porque ninguém consegue dizer "isto está resolvido".',
    padroes: 'As pessoas compensam com esforço individual o que deveria ser resolvido por estrutura. Quando uma decisão trava, alguém puxa para si — e isso vira a norma.',
    estruturas: 'Não há clareza explícita sobre quem tem autoridade para fechar cada tipo de decisão. A informação relevante circula de forma desigual, conectada a quem tem influência.',
    modelos: 'Existe o pressuposto de que pedir clareza sobre autoridade é questionar hierarquia — então ninguém pede, e a ambiguidade persiste como se fosse inevitável.',
  },
  artefatosImpactados: [
    {
      artefatoId: 'poder',
      comoImpacta: 'A autoridade de decisão está difusa: quem pode fechar o quê não é explícito, e isso trava o sistema.',
      tensaoRelacionada: 'Tomada de decisão e Poder e influência ressoaram fortemente.',
    },
    {
      artefatoId: 'fluxos',
      comoImpacta: 'A informação relevante chega tarde ou filtrada para quem precisa agir.',
      tensaoRelacionada: 'Comunicação ressoou parcialmente, conectada a quem tem influência.',
    },
    {
      artefatoId: 'papeis',
      comoImpacta: 'Responsabilidades se sobrepõem sem dono claro, gerando retrabalho e compensação individual.',
      tensaoRelacionada: 'Sobrecarga e Papéis e responsabilidades aparecem ligados.',
    },
  ],
  loops: [
    {
      titulo: 'Decisão que não fecha alimenta sobrecarga',
      descricao: 'Decisões sem dono claro ficam abertas → pessoas compensam com esforço para destravar → a carga sobe → sobra menos espaço para estruturar a decisão → ela continua sem dono.',
      variaveis: [
        { nome: 'Clareza de autoridade', direcao: 'down' as const },
        { nome: 'Esforço de compensação', direcao: 'up' as const },
        { nome: 'Carga percebida', direcao: 'up' as const },
      ],
    },
  ],
  tipologia: {
    tipologiaId: 'transparecer',
    porque: 'O sistema trava porque a autoridade de decisão opera no implícito. Tornar visível quem decide o quê age direto na variável "clareza de autoridade" — a que mais puxa o loop de sobrecarga. É a intervenção de menor resistência para este sistema específico.',
    experimentos: [
      {
        titulo: 'Mapa de decisão público',
        descricao: 'Crie uma página simples que explicita quem tem autoridade em cada tipo de decisão. Não é organograma — é accountability map. Revise mensalmente por 60 dias e observe se as decisões fecham mais rápido.',
        artefatoId: 'poder',
      },
      {
        titulo: 'Decision log compartilhado',
        descricao: 'Para as próximas 10 decisões importantes, registre quem decidiu, com que informação e qual foi a lógica. Torne acessível ao time e observe como isso muda o fluxo de informação.',
        artefatoId: 'fluxos',
      },
    ],
  },
}

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
      completed_at: new Date().toISOString(),
      leitura_sistemica: JSON.stringify(MOCK_RELATORIO),
    })
    .select('id')
    .single()

  if (error || !data) {
    return NextResponse.json({ error: error?.message }, { status: 500 })
  }

  // Redirect RELATIVO: o browser resolve contra o domínio atual (funciona via túnel/preview,
  // não fixa em localhost). NextResponse.redirect exige URL absoluta, então usamos Response cru.
  return new Response(null, {
    status: 307,
    headers: { Location: `/assessment/result/${data.id}` },
  })
}

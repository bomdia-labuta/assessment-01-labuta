// Prompt de comportamento para geração do relatório sistêmico
// Baseado na metodologia do Mapa de Narrativas (Target Teal) + modelo de 4 níveis sistêmicos
// NÃO MODIFICAR sem revisar ref-teorica/ e as memórias do projeto

import type { NodeSlug } from '@/lib/assessment/types'

export interface NarrativaAtivada {
  nodeSlug: NodeSlug
  nodeLabel: string
  texto: string
  ressonancia: 'sim' | 'um_pouco'
  tags: string[]
}

export interface ContextoRelatorio {
  narrativasAtivadas: NarrativaAtivada[]
  narrativasCustomizadas: { nodeLabel: string; texto: string; ressonancia: 'sim' | 'um_pouco' }[]
  nosRevisados: { slug: NodeSlug; label: string }[]
}

// ─── Conhecimento fixo do sistema ───────────────────────────────────────────

export const ARTEFATOS_ESTRUTURAIS = [
  { id: 'normas',        label: 'Normas e Regras',             pergunta: 'Quais normas e tabus afetam o sistema?' },
  { id: 'papeis',        label: 'Papéis e Responsabilidades',  pergunta: 'Quais papéis as pessoas assumem e como interagem com o sistema?' },
  { id: 'fluxos',        label: 'Fluxos de Informação',        pergunta: 'Como os fluxos de informação afetam o sistema?' },
  { id: 'poder',         label: 'Relações de Poder',           pergunta: 'Quem detém poder e como isso afeta o sistema?' },
  { id: 'rituais',       label: 'Rituais',                     pergunta: 'Quais rituais estão presentes no sistema?' },
  { id: 'incentivos',    label: 'Incentivos e Recompensas',    pergunta: 'Quais incentivos estão presentes no sistema observado?' },
  { id: 'processos',     label: 'Processos e Procedimentos',   pergunta: 'Quais processos existem no sistema observado?' },
  { id: 'ferramentas',   label: 'Ferramentas',                 pergunta: 'Quais ferramentas estão sendo utilizadas no sistema?' },
  { id: 'recursos',      label: 'Recursos e Alocação',         pergunta: 'Como a alocação de recursos impacta o sistema?' },
  { id: 'interacoes',    label: 'Interações Sociais',          pergunta: 'Como as interações sociais influenciam o sistema?' },
  { id: 'ocorrencias',   label: 'Ocorrências',                 pergunta: 'Quais acontecimentos afetaram o sistema?' },
  { id: 'ambientes',     label: 'Ambientes Físicos',           pergunta: 'Como o ambiente físico afeta o sistema?' },
] as const

export const TIPOLOGIAS_INTERVENCAO = [
  {
    grupo: 'Vetoriais',
    tipos: [
      { id: 'movimentar',  label: 'Movimentar',  descricao: 'Altera os custos de energia e tempo ao redor de um item — de forma indireta, modifica o espaço sem tocar no item em si.' },
      { id: 'destruir',    label: 'Destruir',    descricao: 'Elimina um item ou sua influência no sistema, removendo sua presença do mapa.' },
      { id: 'estabilizar', label: 'Estabilizar', descricao: 'Mantém um item onde está, sem mais nem menos energia — intervenção de contenção.' },
    ],
  },
  {
    grupo: 'Sinalização',
    tipos: [
      { id: 'condicionar', label: 'Condicionar', descricao: 'Identifica ligações entre itens — quais mudanças possibilitam outras ações, bloqueios e interdependências.' },
      { id: 'monitorar',   label: 'Monitorar',   descricao: 'Foco na observação, com monitores e sensores para acompanhar mudanças em linhas de fronteira do sistema.' },
      { id: 'acionar',     label: 'Acionar',     descricao: 'As condições para agir estão presentes — é hora da mudança direta. A intervenção mais prática e imediata.' },
    ],
  },
  {
    grupo: 'Comunicação',
    tipos: [
      { id: 'pesquisar',    label: 'Pesquisar',    descricao: 'Investigar, dar sentido, ampliar opções. Aprofundar antes de tomar novas ações.' },
      { id: 'solicitar',    label: 'Solicitar',    descricao: 'Engajar pessoas para colaborar ou pedir permissão e apoio — "chamar a cavalaria".' },
      { id: 'transparecer', label: 'Transparecer', descricao: 'Aumentar a visibilidade de algo para que mais pessoas percebam e interajam com aquele elemento.' },
    ],
  },
] as const

// ─── Prompt de sistema ───────────────────────────────────────────────────────

export function buildReportSystemPrompt(): string {
  const artefatosLista = ARTEFATOS_ESTRUTURAIS.map(a => `- ${a.label}: ${a.pergunta}`).join('\n')

  const tipologiasLista = TIPOLOGIAS_INTERVENCAO.flatMap(g =>
    g.tipos.map(t => `- **${t.label}** (${g.grupo}): ${t.descricao}`)
  ).join('\n')

  return `Você é o sistema de leitura sistêmica da Labuta Labs — uma consultoria de design organizacional.

Seu trabalho é gerar um relatório a partir das micro-narrativas que ressoaram com o usuário durante o assessment. Você não faz diagnósticos. Você faz leituras de padrões emergentes.

## VOCABULÁRIO — REGRAS ABSOLUTAS

NUNCA use: diagnóstico, causa raiz, cinco porquês, problema, solução, disfunção, patologia, inventário de problemas, ou qualquer metáfora médica ou de engenharia.

USE: leitura sistêmica, padrões emergentes, tensões, micro-narrativas, hipóteses de intervenção, sistema observado, actante, warm data, o que está emergindo, experimentos, intervenções.

O tom é de um observador que devolve ao sistema a sua própria imagem — não de um consultor que diagnostica doenças.

## ESTRUTURA DO RELATÓRIO (saída estruturada)

Você devolve um objeto estruturado. Cada campo tem uma função específica — preencha com análises densas e relações concretas, não com generalidades. Frases curtas e específicas ao sistema observado.

### leituraSistema — modelo de 4 níveis

Construa a leitura usando os 4 níveis. Cada campo é 1 a 3 frases:
- **eventos**: o que se manifesta visivelmente nas narrativas — o que acontece na superfície
- **padroes**: comportamentos recorrentes que reforçam esses eventos
- **estruturas**: sistemas formais e informais que sustentam esses padrões
- **modelos**: modelos mentais e pressupostos que condicionam os padrões

Regra fundamental: todos os níveis influenciam todos os outros. Não há causa raiz. Não há começo. O sistema é circular e se sustenta a si mesmo.

### artefatosImpactados — cruzamento com a estrutura organizacional

Identifique quais dos 12 artefatos estruturais estão sendo impactados. Cite apenas os relevantes (tipicamente 3 a 5, nunca os 12). Para cada um:
- **artefatoId**: o id do artefato (lista abaixo)
- **comoImpacta**: como esse artefato está sendo tensionado neste sistema (1 frase concreta)
- **tensaoRelacionada**: qual narrativa/tema ativado se conecta a esse artefato (torne a relação explícita — é isto que liga o subjetivo da cultura ao objetivo da estrutura)

Os 12 artefatos estruturais:
${artefatosLista}

### loops — dinâmica de feedback

Construa 1 a 2 loops de feedback a partir das relações entre os temas ativos e os artefatos. Para cada loop:
- **titulo**: nome curto do loop
- **descricao**: por que esse loop se sustenta (como uma variável puxa a próxima, fechando o círculo)
- **variaveis**: as variáveis envolvidas, cada uma com direção de tendência ('up' = aumenta, 'down' = diminui, 'neutral' = se mantém)

### tipologia — uma intervenção + experimentos que endereçam artefatos

Escolha **exatamente 1** tipologia de intervenção — a mais relevante para este sistema:
${tipologiasLista}

- **tipologiaId**: o id da tipologia escolhida (lista acima)
- **porque**: por que ela é a mais indicada para ESTE sistema. Conecte com as narrativas ativadas, os loops e nomeie quais variáveis dos loops ela movimenta.
- **experimentos**: 1 a 3 experimentos concretos para este sistema. Cada experimento DEVE endereçar um dos 12 artefatos estruturais (campo artefatoId) — é assim que a intervenção sobre a cultura se traduz em mudança na estrutura. Para cada experimento:
  - **titulo**: nome curto e acionável
  - **descricao**: o que tentar, em quanto tempo, como saber se funcionou
  - **artefatoId**: qual artefato estrutural esse experimento move

Lembre: as outras 8 tipologias ficam para uma conversa com a Labuta — não as desenvolva aqui.`
}

// ─── Prompt de usuário ───────────────────────────────────────────────────────

export function buildReportUserPrompt(contexto: ContextoRelatorio): string {
  const nosStr = contexto.nosRevisados.map(n => n.label).join(', ')

  const narrativasStr = contexto.narrativasAtivadas
    .map(n => `[${n.nodeLabel}] ${n.ressonancia === 'sim' ? '● ressoou fortemente' : '◐ ressoou parcialmente'}\n"${n.texto}"`)
    .join('\n\n')

  const customStr = contexto.narrativasCustomizadas.length > 0
    ? '\n\n### Micro-narrativas adicionadas pelo próprio usuário:\n' +
      contexto.narrativasCustomizadas
        .map(n => `[${n.nodeLabel}] ${n.ressonancia === 'sim' ? '● fortemente' : '◐ parcialmente'}\n"${n.texto}"`)
        .join('\n\n')
    : ''

  return `O usuário revisou os seguintes temas: ${nosStr}.

As micro-narrativas que ressoaram foram:

${narrativasStr}${customStr}

Gere o relatório sistêmico completo (Blocos 1, 2 e 3) com base nessas informações.`
}

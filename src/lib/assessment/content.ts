import type { AssessmentNode } from './types'

// Layout: centro em (250, 200), raio 150px, 5 nós em pentágono
// Ângulos: top=270°, depois +72° cada
const CX = 250
const CY = 200
const R = 150

function polarToXY(angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180
  return { x: Math.round(CX + R * Math.cos(rad)), y: Math.round(CY + R * Math.sin(rad)) }
}

export const ASSESSMENT_NODES: AssessmentNode[] = [
  {
    id: 'decisao',
    label: 'Decisão',
    ...polarToXY(270), // topo
    narratives: [
      {
        id: 'decisao-1',
        text: 'As decisões importantes acontecem em conversas informais, fora das reuniões formais.',
      },
      {
        id: 'decisao-2',
        text: 'Não está claro quem tem a palavra final em determinadas situações — e isso gera retrabalho.',
      },
      {
        id: 'decisao-3',
        text: 'Decisões são tomadas mas frequentemente revisitadas, como se nunca fossem definitivas.',
      },
    ],
  },
  {
    id: 'papeis',
    label: 'Papéis',
    ...polarToXY(270 + 72),
    narratives: [
      {
        id: 'papeis-1',
        text: 'Pessoas assumem responsabilidades que formalmente são de outra — e ninguém fala sobre isso.',
      },
      {
        id: 'papeis-2',
        text: 'O que está no papel de alguém e o que ela realmente faz são coisas muito diferentes.',
      },
      {
        id: 'papeis-3',
        text: 'Quando algo dá errado, demora para ficar claro de quem era a responsabilidade.',
      },
    ],
  },
  {
    id: 'comunicacao',
    label: 'Comunicação',
    ...polarToXY(270 + 144),
    narratives: [
      {
        id: 'comunicacao-1',
        text: 'Informações importantes chegam a algumas pessoas antes de outras — e isso cria assimetrias.',
      },
      {
        id: 'comunicacao-2',
        text: 'Há coisas que todo mundo sabe mas ninguém diz em voz alta nas reuniões.',
      },
      {
        id: 'comunicacao-3',
        text: 'A comunicação formal (e-mail, doc) e a comunicação real (corredor, Slack informal) são mundos separados.',
      },
    ],
  },
  {
    id: 'aprendizado',
    label: 'Aprendizado',
    ...polarToXY(270 + 216),
    narratives: [
      {
        id: 'aprendizado-1',
        text: 'Os mesmos erros tendem a se repetir porque não há um processo de aprender com eles.',
      },
      {
        id: 'aprendizado-2',
        text: 'Quando um projeto termina, o conhecimento fica com as pessoas — não com a organização.',
      },
      {
        id: 'aprendizado-3',
        text: 'Experimentar algo novo tende a gerar mais resistência do que apoio, mesmo quando a lógica é boa.',
      },
    ],
  },
  {
    id: 'ritmos',
    label: 'Ritmos',
    ...polarToXY(270 + 288),
    narratives: [
      {
        id: 'ritmos-1',
        text: 'O time opera em modo de urgência constante — tudo é para ontem e nada tem prioridade clara.',
      },
      {
        id: 'ritmos-2',
        text: 'Os momentos de pausa para pensar estrategicamente são raros ou inexistentes.',
      },
      {
        id: 'ritmos-3',
        text: 'O ciclo de planejamento e o ciclo de execução não conversam bem — um invalida o outro.',
      },
    ],
  },
]

// Posição do nó central (decorativo)
export const CENTER_NODE = { x: CX, y: CY }

// Dimensões do SVG
export const SVG_WIDTH = 500
export const SVG_HEIGHT = 400

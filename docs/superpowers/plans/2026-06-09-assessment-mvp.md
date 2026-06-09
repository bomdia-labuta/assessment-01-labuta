# Assessment Leads Labuta — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir o assessment de leitura sistêmica da Labuta — grafo navegável com micro-narrativas, email gate, resultado gerado por agente IA (Claude), e tipologias de intervenção expandidas.

**Architecture:** Next.js App Router com Server Components onde possível. Estado do assessment em `sessionStorage` entre páginas. Resultado gerado server-side via Route Handler (Claude API + Supabase). Emails via Resend.

**Tech Stack:** Next.js 14, React 19, TypeScript, Tailwind CSS, Supabase (Postgres), Claude API (anthropic SDK), Resend, Zod, Jest + React Testing Library.

---

## File Map

```
src/
├── app/
│   ├── page.tsx                          # Landing — modificar
│   ├── assessment/
│   │   ├── page.tsx                      # Grafo Navegável — criar
│   │   ├── gate/page.tsx                 # Email Gate — criar
│   │   └── result/[id]/page.tsx          # Resultado — criar
│   └── api/assessment/
│       ├── submit/route.ts               # POST: salva + gera resultado — criar
│       └── result/[id]/route.ts          # GET: busca resultado — criar
├── components/
│   ├── grafo/
│   │   ├── GrafoCanvas.tsx               # SVG interativo — criar
│   │   ├── GrafoNode.tsx                 # Nó individual — criar
│   │   └── NarrativaPanel.tsx            # Painel lateral Q&A — criar
│   └── resultado/
│       ├── GrafoResult.tsx               # Grafo estático ativado — criar
│       ├── LeituraSistemica.tsx          # Narrativa do agente — criar
│       └── TipologiaCard.tsx             # Card expandido — criar
└── lib/
    ├── assessment/
    │   ├── types.ts                      # Todos os tipos — criar
    │   ├── content.ts                    # Nós + micro-narrativas (placeholder) — criar
    │   ├── tipologias.ts                 # 9 tipologias com conteúdo completo — criar
    │   ├── scoring.ts                    # Calcula ativação dos nós — criar
    │   └── mapeamento.ts                 # Padrão de nós → tipologias — criar
    ├── ai/
    │   └── orgDesigner.ts               # Chamada Claude API — criar
    └── email/
        ├── resend.ts                     # Cliente Resend — criar
        └── templates.ts                  # Templates HTML — criar

supabase/
└── migrations/
    └── 001_assessment_responses.sql      # Schema — criar

__tests__/
├── lib/assessment/scoring.test.ts        # Testes de scoring
└── lib/assessment/mapeamento.test.ts     # Testes de mapeamento
```

---

## Task 1: Setup Jest + Tipos base

**Files:**
- Create: `jest.config.js`
- Create: `jest.setup.ts`
- Create: `src/lib/assessment/types.ts`
- Modify: `package.json`

- [ ] **Instalar dependências de teste**

```bash
npm install --save-dev jest @types/jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom ts-jest
```

- [ ] **Criar `jest.config.js`**

```js
const nextJest = require('next/jest')
const createJestConfig = nextJest({ dir: './' })
module.exports = createJestConfig({
  setupFilesAfterFramework: ['<rootDir>/jest.setup.ts'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  testPathPattern: '__tests__',
})
```

- [ ] **Criar `jest.setup.ts`**

```ts
import '@testing-library/jest-dom'
```

- [ ] **Adicionar script no `package.json`** (dentro de `"scripts"`)

```json
"test": "jest",
"test:watch": "jest --watch"
```

- [ ] **Criar `src/lib/assessment/types.ts`**

```typescript
export type NarrativeResponse = 'ressoa' | 'nao_tanto'

export interface Narrative {
  id: string
  text: string
}

export interface AssessmentNode {
  id: string
  label: string
  narratives: Narrative[]
  // Posição no SVG (grafo fixo)
  x: number
  y: number
}

// { nodeId: { narrativeId: 'ressoa' | 'nao_tanto' } }
export type ResponseMap = Record<string, Record<string, NarrativeResponse>>

export interface ActivatedNode {
  nodeId: string
  label: string
  intensity: number // 0-1: proporção de respostas 'ressoa'
}

export interface TipologiaVariable {
  name: string
  direction: 'up' | 'down' | 'neutral'
}

export interface TipologiaExperiment {
  title: string
  description: string
}

export interface TipologiaFeedbackLoop {
  positive: string   // reforço positivo (↑)
  risk: string       // risco de amplificação (−)
  observe: string    // o que observar (↺)
}

export type TipologiaCategory = 'vetorial' | 'sinalizacao' | 'comunicacao'

export interface Tipologia {
  id: string
  name: string
  category: TipologiaCategory
  categoryLabel: string
  icon: string
  shortDescription: string
  effects: string[]
  feedbackLoop: TipologiaFeedbackLoop
  variables: TipologiaVariable[]
  experiments: TipologiaExperiment[]
}

export interface AssessmentResult {
  id: string
  createdAt: string
  name: string
  email: string
  activatedNodes: ActivatedNode[]
  narrativeText: string
  tipologiasIds: string[]
}
```

- [ ] **Verificar tipos**

```bash
npx tsc --noEmit
```

Esperado: sem erros.

- [ ] **Commit**

```bash
git add jest.config.js jest.setup.ts src/lib/assessment/types.ts package.json package-lock.json
git commit -m "feat: add jest setup and assessment types"
```

---

## Task 2: Migration Supabase

**Files:**
- Create: `supabase/migrations/001_assessment_responses.sql`

- [ ] **Criar diretório e migration**

```bash
mkdir -p supabase/migrations
```

- [ ] **Criar `supabase/migrations/001_assessment_responses.sql`**

```sql
CREATE TABLE assessment_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  marketing_consent BOOLEAN DEFAULT false,
  responses JSONB NOT NULL,
  activated_nodes JSONB,
  narrative_text TEXT,
  tipologias_ids TEXT[],
  result_shared BOOLEAN DEFAULT false,
  notification_sent BOOLEAN DEFAULT false,
  result_email_sent BOOLEAN DEFAULT false
);

-- Índice para busca por email
CREATE INDEX idx_assessment_responses_email ON assessment_responses(email);

-- RLS: apenas service role pode ler/escrever (sem auth de usuário)
ALTER TABLE assessment_responses ENABLE ROW LEVEL SECURITY;
```

- [ ] **Aplicar no Supabase** (via dashboard SQL editor ou CLI)

```bash
# Se tiver Supabase CLI instalado:
supabase db push
# Ou colar o SQL no Dashboard → SQL Editor
```

- [ ] **Commit**

```bash
git add supabase/migrations/001_assessment_responses.sql
git commit -m "feat: add supabase migration for assessment_responses"
```

---

## Task 3: Conteúdo — Tipologias (9 tipologias completas)

**Files:**
- Create: `src/lib/assessment/tipologias.ts`

- [ ] **Criar `src/lib/assessment/tipologias.ts`**

```typescript
import type { Tipologia } from './types'

export const TIPOLOGIAS: Record<string, Tipologia> = {
  movimentar: {
    id: 'movimentar',
    name: 'Movimentar',
    category: 'vetorial',
    categoryLabel: 'Vetorial',
    icon: '🧭',
    shortDescription: 'Altera os custos de energia e tempo ao redor de um item — não o item em si.',
    effects: [
      'Muda o espaço de ação sem forçar mudança direta',
      'Pode tornar um comportamento mais ou menos custoso',
      'Influencia o sistema de forma indireta e menos resistida',
      'Efeito se distribui pelo sistema ao longo do tempo',
    ],
    feedbackLoop: {
      positive: 'Menor resistência → mais ação espontânea → sistema se move sem empurrar',
      risk: 'Pode deslocar o problema para outro ponto do sistema',
      observe: 'Comportamentos que mudam sem intervenção direta',
    },
    variables: [
      { name: 'Autonomia operacional', direction: 'up' },
      { name: 'Resistência a mudança', direction: 'down' },
      { name: 'Custo de coordenação', direction: 'neutral' },
    ],
    experiments: [
      {
        title: 'Remover um bloqueio invisível',
        description: 'Identifique algo que torna um comportamento desejado mais difícil do que precisa ser. Remova ou reduza esse bloqueio por 30 dias e observe se o comportamento aumenta.',
      },
      {
        title: 'Tornar o caminho certo mais fácil',
        description: 'Escolha uma prática que quer encorajar e reduza a fricção para fazê-la. Templates, rituais leves, lembretes — qualquer coisa que baixe o custo de entrada.',
      },
      {
        title: 'Aumentar o custo de uma prática indesejada',
        description: 'Sem proibir, torne levemente mais custoso algo que quer desencorajar — mais etapas, visibilidade, aprovação. Observe a mudança de frequência.',
      },
    ],
  },

  destruir: {
    id: 'destruir',
    name: 'Destruir',
    category: 'vetorial',
    categoryLabel: 'Vetorial',
    icon: '🔥',
    shortDescription: 'Elimina um item ou sua influência no sistema.',
    effects: [
      'Libera energia antes presa em algo que não serve mais',
      'Pode criar um vácuo que outro item (melhor) preenche',
      'Reduz complexidade local imediatamente',
      'Exige atenção às dependências ocultas',
    ],
    feedbackLoop: {
      positive: 'Menos ruído → mais clareza → melhor uso de atenção',
      risk: 'Pode criar instabilidade temporária ou revelar dependências não mapeadas',
      observe: 'O que surge naturalmente no lugar do que foi removido',
    },
    variables: [
      { name: 'Complexidade sistêmica', direction: 'down' },
      { name: 'Clareza operacional', direction: 'up' },
      { name: 'Dependências ocultas', direction: 'neutral' },
    ],
    experiments: [
      {
        title: 'Cancelar uma reunião recorrente por 30 dias',
        description: 'Escolha uma reunião cuja utilidade é questionável. Cancele por um mês. Observe o que era realmente necessário e o que era hábito.',
      },
      {
        title: 'Eliminar um processo que ninguém questiona',
        description: 'Mapeie um processo que "sempre foi assim". Remova ou simplifique radicalmente. Meça o que muda — positivo e negativo.',
      },
      {
        title: 'Remover um papel que perdeu função',
        description: 'Identifique uma responsabilidade formal que na prática ninguém exerce ou que se tornou redundante. Torne explícita a remoção.',
      },
    ],
  },

  estabilizar: {
    id: 'estabilizar',
    name: 'Estabilizar',
    category: 'vetorial',
    categoryLabel: 'Vetorial',
    icon: '⚖️',
    shortDescription: 'Mantém um actante onde está — nem mais nem menos energia.',
    effects: [
      'Preserva o que está funcionando durante períodos de mudança',
      'Reduz risco de intervenção desnecessária em algo saudável',
      'Libera atenção para áreas que realmente precisam de energia',
      'Sinaliza intencionalidade — não é omissão, é escolha',
    ],
    feedbackLoop: {
      positive: 'Estabilidade deliberada → confiança do time → mais capacidade para mudança em outras áreas',
      risk: 'Usado em excesso, pode criar inércia e resistência a mudanças necessárias',
      observe: 'Se a estabilidade é ativa (intencional) ou passiva (evitação)',
    },
    variables: [
      { name: 'Previsibilidade', direction: 'up' },
      { name: 'Confiança no sistema', direction: 'up' },
      { name: 'Capacidade de absorver mudança', direction: 'neutral' },
    ],
    experiments: [
      {
        title: 'Documentar explicitamente o que não vai mudar',
        description: 'Liste 3-5 elementos do sistema que serão preservados durante o próximo ciclo de mudança. Comunique ativamente. Observe como o time reage.',
      },
      {
        title: 'Criar um ritual de confirmação periódica',
        description: 'Trimestralmente, revise o que está sendo estabilizado e confirme se ainda é a escolha certa. Torne a decisão consciente, não automática.',
      },
    ],
  },

  condicionar: {
    id: 'condicionar',
    name: 'Condicionar',
    category: 'sinalizacao',
    categoryLabel: 'Sinalização',
    icon: '🔗',
    shortDescription: 'Mapeia ligações entre itens — o que possibilita o quê.',
    effects: [
      'Torna interdependências visíveis antes de agir',
      'Revela bloqueios que impedem outras ações',
      'Permite sequenciar intervenções com mais precisão',
      'Cria um mapa de causalidade do sistema',
    ],
    feedbackLoop: {
      positive: 'Visibilidade de ligações → melhores decisões de sequência → menos retrabalho',
      risk: 'Pode paralisar por excesso de análise — mapa não é o território',
      observe: 'Quais conexões mudam de natureza após intervenções pontuais',
    },
    variables: [
      { name: 'Clareza causal', direction: 'up' },
      { name: 'Surpresas sistêmicas', direction: 'down' },
      { name: 'Velocidade de análise', direction: 'neutral' },
    ],
    experiments: [
      {
        title: 'Mapear o que precisa acontecer antes de X',
        description: 'Escolha uma iniciativa travada. Mapeie todas as condições que precisam ser verdadeiras para ela avançar. Identifique o menor passo que desbloqueia mais.',
      },
      {
        title: 'Identificar o gargalo que libera tudo',
        description: 'Faça a pergunta: "Se resolvêssemos apenas uma coisa, o que liberaria mais energia no sistema?" Mapeie as dependências desse item.',
      },
    ],
  },

  monitorar: {
    id: 'monitorar',
    name: 'Monitorar',
    category: 'sinalizacao',
    categoryLabel: 'Sinalização',
    icon: '👁️',
    shortDescription: 'Observação focada em linhas de fronteira e mudanças importantes.',
    effects: [
      'Captura sinais antes que se tornem problemas',
      'Cria base de dados real para decisões futuras',
      'Aumenta a sensibilidade do sistema a mudanças',
      'Pode revelar padrões invisíveis para quem está dentro',
    ],
    feedbackLoop: {
      positive: 'Observação sistemática → antecipação → intervenções menores e mais precisas',
      risk: 'Monitorar sem contexto pode gerar ansiedade ou paralisia por excesso de dados',
      observe: 'O que os dados revelam que as conversas não revelaram',
    },
    variables: [
      { name: 'Capacidade de antecipação', direction: 'up' },
      { name: 'Qualidade de decisão', direction: 'up' },
      { name: 'Surpresas operacionais', direction: 'down' },
    ],
    experiments: [
      {
        title: 'Criar um indicador simples para uma tensão específica',
        description: 'Escolha uma variável que você suspeita ser importante mas nunca mediu. Crie uma forma simples de acompanhá-la semanalmente por 6 semanas.',
      },
      {
        title: 'Pedir feedback estruturado por 30 dias',
        description: 'Escolha um processo ou interação. Peça feedback estruturado (3 perguntas fixas) de quem participa, durante 30 dias. Analise os padrões.',
      },
    ],
  },

  acionar: {
    id: 'acionar',
    name: 'Acionar',
    category: 'sinalizacao',
    categoryLabel: 'Sinalização',
    icon: '👆',
    shortDescription: 'As condições estão presentes — agora podemos e devemos agir.',
    effects: [
      'Gera movimento direto e visível no sistema',
      'Mais imediato que outras intervenções — efeito rápido',
      'Exige clareza sobre o que está sendo mudado e por quê',
      'Pode gerar resistência se o sistema não estava preparado',
    ],
    feedbackLoop: {
      positive: 'Ação → aprendizado rápido → próxima ação mais informada',
      risk: 'Ação prematura pode gerar reação que trava o sistema',
      observe: 'Se a ação cria o efeito desejado ou um efeito diferente (e o que isso revela)',
    },
    variables: [
      { name: 'Velocidade de mudança', direction: 'up' },
      { name: 'Aprendizado organizacional', direction: 'up' },
      { name: 'Resistência do sistema', direction: 'neutral' },
    ],
    experiments: [
      {
        title: 'Implementar uma mudança pequena com data de revisão',
        description: 'Escolha algo que está sendo adiado. Implemente a menor versão possível. Marque uma data de revisão em 3 semanas. Observe o que acontece.',
      },
      {
        title: 'Tomar uma decisão que estava travada',
        description: 'Identifique uma decisão que o sistema está evitando. Tome-a — mesmo que imperfeita. Documente o raciocínio. Observe como o sistema se ajusta.',
      },
    ],
  },

  pesquisar: {
    id: 'pesquisar',
    name: 'Pesquisar',
    category: 'comunicacao',
    categoryLabel: 'Comunicação',
    icon: '🔍',
    shortDescription: 'Investigar, dar sentido, ampliar opções antes de agir.',
    effects: [
      'Aumenta a qualidade das opções disponíveis para decisão',
      'Reduz tomada de decisão baseada em intuição não verificada',
      'Cria linguagem compartilhada sobre o problema',
      'Pode revelar que o problema real é diferente do que parece',
    ],
    feedbackLoop: {
      positive: 'Mais dados → melhores escolhas → menos retrabalho por decisões mal informadas',
      risk: 'Pesquisa infinita pode se tornar desculpa para não agir',
      observe: 'Quando a pesquisa começa a confirmar o que já se sabe vs. revelar algo novo',
    },
    variables: [
      { name: 'Qualidade de decisão', direction: 'up' },
      { name: 'Opções disponíveis', direction: 'up' },
      { name: 'Velocidade de ação', direction: 'neutral' },
    ],
    experiments: [
      {
        title: 'Três entrevistas com pessoas diretamente afetadas',
        description: 'Escolha 3 pessoas que vivem o problema no dia a dia. Faça entrevistas de 30 minutos com perguntas abertas. Compile os padrões — não as soluções.',
      },
      {
        title: 'Sessão de sensemaking com o time',
        description: 'Reúna o time por 90 minutos. Apresente os dados que vocês têm. Pergunte: o que isso revela? O que ainda não sabemos? Mapeie as lacunas.',
      },
    ],
  },

  solicitar: {
    id: 'solicitar',
    name: 'Solicitar',
    category: 'comunicacao',
    categoryLabel: 'Comunicação',
    icon: '🤝',
    shortDescription: 'Engajar colaboração ou permissão — "chamar a cavalaria".',
    effects: [
      'Expande a capacidade de ação além dos recursos disponíveis',
      'Cria alianças que legitimam a intervenção',
      'Pode revelar resistências latentes antes da implementação',
      'Distribui a responsabilidade de forma mais ampla',
    ],
    feedbackLoop: {
      positive: 'Colaboração → mais recursos e perspectivas → intervenções mais robustas',
      risk: 'Muitas pessoas envolvidas pode diluir responsabilidade e desacelerar',
      observe: 'Quem se engaja espontaneamente e quem resiste — e o que isso revela',
    },
    variables: [
      { name: 'Capacidade de ação', direction: 'up' },
      { name: 'Legitimidade da intervenção', direction: 'up' },
      { name: 'Autonomia individual', direction: 'neutral' },
    ],
    experiments: [
      {
        title: 'Pedir apoio de alguém com influência no sistema',
        description: 'Identifique uma pessoa cuja adesão mudaria a dinâmica. Faça uma conversa direta e honesta sobre o que você está tentando fazer e o que precisa dela.',
      },
      {
        title: 'Co-desenhar a solução com um grupo pequeno',
        description: 'Em vez de apresentar uma solução pronta, convoque 3-4 pessoas para co-criá-la. O processo de criação já cria comprometimento.',
      },
    ],
  },

  transparecer: {
    id: 'transparecer',
    name: 'Transparecer',
    category: 'comunicacao',
    categoryLabel: 'Comunicação',
    icon: '💡',
    shortDescription: 'Tornar visível o que opera no implícito para estimular interações.',
    effects: [
      'Reduz ambiguidade e repetição de conversas sobre o que já deveria ser claro',
      'Cria superfície de contestação — o visível pode ser questionado e melhorado',
      'Sinaliza intenção de clareza e abertura ao time',
      'Pode revelar acordos implícitos que ninguém sabia que existiam',
    ],
    feedbackLoop: {
      positive: 'Visibilidade → mais interações reais → mais dados sobre como o sistema funciona de fato',
      risk: 'Visibilidade sem contexto pode gerar ansiedade ou leituras equivocadas',
      observe: 'Se as conversas mudam de natureza (mais substância, menos política) após a transparência',
    },
    variables: [
      { name: 'Clareza de autoridade', direction: 'up' },
      { name: 'Velocidade de decisão', direction: 'up' },
      { name: 'Ambiguidade de papéis', direction: 'down' },
      { name: 'Tensão de poder (pode subir antes de cair)', direction: 'neutral' },
    ],
    experiments: [
      {
        title: 'Mapa de decisão público',
        description: 'Crie uma página simples (Notion, Miro) que deixa explícito quem tem autoridade em quais tipos de decisão. Não é organograma — é accountability map. Revise mensalmente.',
      },
      {
        title: 'Decision log compartilhado',
        description: 'Para as próximas 10 decisões importantes, registre: quem decidiu, com que informação, qual foi a lógica. Torne acessível ao time. Observe como isso muda futuras decisões.',
      },
      {
        title: 'Sessão de leitura coletiva',
        description: 'Traga o mapa de decisão (ou qualquer artefato que explicita o sistema) para uma conversa de time. Pergunte: o que está visível aqui? O que deveria estar mas não está?',
      },
    ],
  },
}

export function getTipologia(id: string): Tipologia | undefined {
  return TIPOLOGIAS[id]
}

export function getTipologiasByIds(ids: string[]): Tipologia[] {
  return ids.map(id => TIPOLOGIAS[id]).filter(Boolean)
}
```

- [ ] **Verificar tipos**

```bash
npx tsc --noEmit
```

- [ ] **Commit**

```bash
git add src/lib/assessment/tipologias.ts
git commit -m "feat: add 9 tipologias de intervencao with full content"
```

---

## Task 4: Conteúdo — Nós e Micro-narrativas (placeholder)

**Files:**
- Create: `src/lib/assessment/content.ts`

- [ ] **Criar `src/lib/assessment/content.ts`**

```typescript
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
```

- [ ] **Commit**

```bash
git add src/lib/assessment/content.ts
git commit -m "feat: add placeholder assessment nodes and narratives"
```

---

## Task 5: Scoring Logic (TDD)

**Files:**
- Create: `src/lib/assessment/scoring.ts`
- Create: `__tests__/lib/assessment/scoring.test.ts`

- [ ] **Criar `__tests__/lib/assessment/scoring.test.ts`**

```typescript
import { calculateActivatedNodes } from '@/lib/assessment/scoring'
import { ASSESSMENT_NODES } from '@/lib/assessment/content'

describe('calculateActivatedNodes', () => {
  it('retorna intensity 1.0 quando todas respostas são ressoa', () => {
    const responses = {
      decisao: {
        'decisao-1': 'ressoa' as const,
        'decisao-2': 'ressoa' as const,
        'decisao-3': 'ressoa' as const,
      },
    }
    const result = calculateActivatedNodes(responses, ASSESSMENT_NODES)
    const decisaoNode = result.find(n => n.nodeId === 'decisao')
    expect(decisaoNode).toBeDefined()
    expect(decisaoNode!.intensity).toBe(1)
  })

  it('retorna intensity 0 quando nenhuma resposta é ressoa', () => {
    const responses = {
      decisao: {
        'decisao-1': 'nao_tanto' as const,
        'decisao-2': 'nao_tanto' as const,
        'decisao-3': 'nao_tanto' as const,
      },
    }
    const result = calculateActivatedNodes(responses, ASSESSMENT_NODES)
    const decisaoNode = result.find(n => n.nodeId === 'decisao')
    expect(decisaoNode?.intensity).toBe(0)
  })

  it('retorna intensity 0.67 quando 2 de 3 são ressoa', () => {
    const responses = {
      papeis: {
        'papeis-1': 'ressoa' as const,
        'papeis-2': 'ressoa' as const,
        'papeis-3': 'nao_tanto' as const,
      },
    }
    const result = calculateActivatedNodes(responses, ASSESSMENT_NODES)
    const papeisNode = result.find(n => n.nodeId === 'papeis')
    expect(papeisNode!.intensity).toBeCloseTo(0.67, 2)
  })

  it('inclui apenas nós que têm ao menos uma resposta', () => {
    const responses = {
      decisao: { 'decisao-1': 'ressoa' as const },
    }
    const result = calculateActivatedNodes(responses, ASSESSMENT_NODES)
    expect(result).toHaveLength(1)
    expect(result[0].nodeId).toBe('decisao')
  })

  it('ordena por intensity decrescente', () => {
    const responses = {
      decisao: { 'decisao-1': 'ressoa' as const, 'decisao-2': 'ressoa' as const, 'decisao-3': 'ressoa' as const },
      papeis: { 'papeis-1': 'ressoa' as const, 'papeis-2': 'nao_tanto' as const, 'papeis-3': 'nao_tanto' as const },
    }
    const result = calculateActivatedNodes(responses, ASSESSMENT_NODES)
    expect(result[0].intensity).toBeGreaterThanOrEqual(result[1].intensity)
  })
})
```

- [ ] **Rodar e verificar que falha**

```bash
npx jest __tests__/lib/assessment/scoring.test.ts
```

Esperado: FAIL — "Cannot find module"

- [ ] **Criar `src/lib/assessment/scoring.ts`**

```typescript
import type { AssessmentNode, ActivatedNode, ResponseMap } from './types'

export function calculateActivatedNodes(
  responses: ResponseMap,
  nodes: AssessmentNode[]
): ActivatedNode[] {
  const nodeMap = new Map(nodes.map(n => [n.id, n]))

  return Object.entries(responses)
    .filter(([, narrativeResponses]) => Object.keys(narrativeResponses).length > 0)
    .map(([nodeId, narrativeResponses]) => {
      const node = nodeMap.get(nodeId)
      const label = node?.label ?? nodeId
      const total = Object.keys(narrativeResponses).length
      const ressoaCount = Object.values(narrativeResponses).filter(r => r === 'ressoa').length
      const intensity = total > 0 ? ressoaCount / total : 0
      return { nodeId, label, intensity }
    })
    .sort((a, b) => b.intensity - a.intensity)
}
```

- [ ] **Rodar e verificar que passa**

```bash
npx jest __tests__/lib/assessment/scoring.test.ts
```

Esperado: PASS (5 testes)

- [ ] **Commit**

```bash
git add src/lib/assessment/scoring.ts __tests__/lib/assessment/scoring.test.ts
git commit -m "feat: add node scoring logic with tests"
```

---

## Task 6: Mapeamento Logic (TDD)

**Files:**
- Create: `src/lib/assessment/mapeamento.ts`
- Create: `__tests__/lib/assessment/mapeamento.test.ts`

- [ ] **Criar `__tests__/lib/assessment/mapeamento.test.ts`**

```typescript
import { mapToTipologias } from '@/lib/assessment/mapeamento'
import type { ActivatedNode } from '@/lib/assessment/types'

describe('mapToTipologias', () => {
  it('sugere transparecer quando decisao e papeis têm alta intensidade', () => {
    const nodes: ActivatedNode[] = [
      { nodeId: 'decisao', label: 'Decisão', intensity: 0.9 },
      { nodeId: 'papeis', label: 'Papéis', intensity: 0.8 },
    ]
    const result = mapToTipologias(nodes)
    expect(result).toContain('transparecer')
    expect(result).toContain('condicionar')
  })

  it('sugere pesquisar quando aprendizado tem alta intensidade', () => {
    const nodes: ActivatedNode[] = [
      { nodeId: 'aprendizado', label: 'Aprendizado', intensity: 0.9 },
    ]
    const result = mapToTipologias(nodes)
    expect(result).toContain('pesquisar')
  })

  it('sugere monitorar quando ritmos tem alta intensidade', () => {
    const nodes: ActivatedNode[] = [
      { nodeId: 'ritmos', label: 'Ritmos', intensity: 0.8 },
    ]
    const result = mapToTipologias(nodes)
    expect(result).toContain('monitorar')
  })

  it('sugere estabilizar quando multiplos nós têm alta intensidade', () => {
    const nodes: ActivatedNode[] = [
      { nodeId: 'decisao', label: 'Decisão', intensity: 0.9 },
      { nodeId: 'papeis', label: 'Papéis', intensity: 0.8 },
      { nodeId: 'comunicacao', label: 'Comunicação', intensity: 0.9 },
    ]
    const result = mapToTipologias(nodes)
    expect(result).toContain('estabilizar')
  })

  it('retorna no máximo 3 tipologias', () => {
    const nodes: ActivatedNode[] = [
      { nodeId: 'decisao', label: 'Decisão', intensity: 1 },
      { nodeId: 'papeis', label: 'Papéis', intensity: 1 },
      { nodeId: 'comunicacao', label: 'Comunicação', intensity: 1 },
      { nodeId: 'aprendizado', label: 'Aprendizado', intensity: 1 },
      { nodeId: 'ritmos', label: 'Ritmos', intensity: 1 },
    ]
    const result = mapToTipologias(nodes)
    expect(result.length).toBeLessThanOrEqual(3)
  })

  it('retorna array vazio quando não há nós ativados', () => {
    expect(mapToTipologias([])).toEqual([])
  })
})
```

- [ ] **Rodar e verificar que falha**

```bash
npx jest __tests__/lib/assessment/mapeamento.test.ts
```

Esperado: FAIL

- [ ] **Criar `src/lib/assessment/mapeamento.ts`**

```typescript
import type { ActivatedNode } from './types'

const HIGH = 0.6 // threshold para "fortemente ativado"

export function mapToTipologias(activatedNodes: ActivatedNode[]): string[] {
  const tipologias = new Set<string>()
  const highNodes = activatedNodes.filter(n => n.intensity >= HIGH)
  const nodeIds = new Set(highNodes.map(n => n.nodeId))

  // Regra: decisão + papéis → transparecer + condicionar
  if (nodeIds.has('decisao') && nodeIds.has('papeis')) {
    tipologias.add('transparecer')
    tipologias.add('condicionar')
  }

  // Regra: só decisão → transparecer
  if (nodeIds.has('decisao') && !nodeIds.has('papeis')) {
    tipologias.add('transparecer')
  }

  // Regra: papéis sem decisão → solicitar
  if (nodeIds.has('papeis') && !nodeIds.has('decisao')) {
    tipologias.add('solicitar')
  }

  // Regra: comunicação → transparecer (se ainda não, senão monitorar)
  if (nodeIds.has('comunicacao')) {
    tipologias.has('transparecer') ? tipologias.add('monitorar') : tipologias.add('transparecer')
  }

  // Regra: aprendizado → pesquisar + monitorar
  if (nodeIds.has('aprendizado')) {
    tipologias.add('pesquisar')
    tipologias.add('monitorar')
  }

  // Regra: ritmos → monitorar + movimentar
  if (nodeIds.has('ritmos')) {
    tipologias.add('monitorar')
    tipologias.add('movimentar')
  }

  // Regra: múltiplos nós com alta intensidade → estabilizar (o que não tocar)
  if (highNodes.length >= 3) {
    tipologias.add('estabilizar')
  }

  // Fallback: se nada foi ativado acima do threshold, usar o nó mais ativado
  if (tipologias.size === 0 && activatedNodes.length > 0) {
    const top = activatedNodes[0]
    if (top.nodeId === 'decisao') tipologias.add('transparecer')
    else if (top.nodeId === 'papeis') tipologias.add('solicitar')
    else if (top.nodeId === 'comunicacao') tipologias.add('transparecer')
    else if (top.nodeId === 'aprendizado') tipologias.add('pesquisar')
    else if (top.nodeId === 'ritmos') tipologias.add('monitorar')
    else tipologias.add('pesquisar')
  }

  return Array.from(tipologias).slice(0, 3)
}
```

- [ ] **Rodar e verificar que passa**

```bash
npx jest __tests__/lib/assessment/mapeamento.test.ts
```

Esperado: PASS (6 testes)

- [ ] **Commit**

```bash
git add src/lib/assessment/mapeamento.ts __tests__/lib/assessment/mapeamento.test.ts
git commit -m "feat: add tipologia mapping logic with tests"
```

---

## Task 7: Variáveis de Ambiente

**Files:**
- Modify: `.env.example`
- Create: `.env.local` (não commitado)

- [ ] **Atualizar `.env.example`**

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Claude API
ANTHROPIC_API_KEY=sk-ant-...

# Resend
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=assessment@labuta.com
LABUTA_NOTIFICATION_EMAIL=oilabutalabs@gmail.com

# Agente Org Designer (system prompt completo em uma linha)
LABUTA_ORG_DESIGNER_PROMPT=Você é um org designer da Labuta Labs...
```

- [ ] **Criar `.env.local`** com valores reais (não commitado — verificar `.gitignore`)

```bash
# Verificar que .env.local está no .gitignore
grep ".env.local" .gitignore || echo ".env.local" >> .gitignore
```

- [ ] **Commit**

```bash
git add .env.example .gitignore
git commit -m "chore: update env example with all required variables"
```

---

## Task 8: Org Designer Agent (Claude API)

**Files:**
- Create: `src/lib/ai/orgDesigner.ts`

- [ ] **Instalar SDK da Anthropic**

```bash
npm install @anthropic-ai/sdk
```

- [ ] **Criar `src/lib/ai/orgDesigner.ts`**

```typescript
import Anthropic from '@anthropic-ai/sdk'
import type { ActivatedNode } from '../assessment/types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface OrgDesignerInput {
  activatedNodes: ActivatedNode[]
  suggestedTipologias: string[]
}

export async function generateLeituraSistemica(input: OrgDesignerInput): Promise<string> {
  const systemPrompt = process.env.LABUTA_ORG_DESIGNER_PROMPT ?? `
Você é um org designer da Labuta Labs. Sua abordagem é baseada em pensamento sistêmico,
design organizacional e complexidade. Você não diagnostica — você oferece leituras possíveis
de sistemas. Sua linguagem é de praticante: precisa, sem jargão desnecessário, acolhedora
da incerteza. Nunca diga que algo "está errado" — diga o que "aparece" ou "emerge".
Sempre deixe claro que é uma leitura possível, não a única.
  `.trim()

  const highNodes = input.activatedNodes.filter(n => n.intensity >= 0.6)
  const allNodes = input.activatedNodes

  const userMessage = `
Contexto do assessment:

Pontos de alavancagem fortemente ativados (intensity >= 0.6):
${highNodes.map(n => `- ${n.label} (intensity: ${(n.intensity * 100).toFixed(0)}%)`).join('\n') || '(nenhum fortemente ativado)'}

Todos os pontos explorados:
${allNodes.map(n => `- ${n.label}: ${(n.intensity * 100).toFixed(0)}% de ressonância`).join('\n')}

Tipologias sugeridas para este padrão: ${input.suggestedTipologias.join(', ')}

Escreva uma leitura sistêmica deste padrão. A leitura deve:
1. Ter entre 120-180 palavras
2. Usar linguagem de org design (tensões, fluxos, padrões, interdependências)
3. Deixar claro que é uma leitura possível, não a única
4. Não apontar "problemas" — apontar o que aparece/emerge
5. Terminar com um possível caminho de exploração (não uma solução)
6. NÃO mencionar as tipologias pelo nome — elas aparecem separadamente
  `.trim()

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 400,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  })

  const textBlock = message.content.find(block => block.type === 'text')
  return textBlock?.type === 'text' ? textBlock.text : 'Leitura não disponível no momento.'
}
```

- [ ] **Commit**

```bash
git add src/lib/ai/orgDesigner.ts package.json package-lock.json
git commit -m "feat: add org designer agent with Claude API integration"
```

---

## Task 9: Email Templates + Resend

**Files:**
- Create: `src/lib/email/resend.ts`
- Create: `src/lib/email/templates.ts`

- [ ] **Instalar Resend**

```bash
npm install resend
```

- [ ] **Criar `src/lib/email/resend.ts`**

```typescript
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM_EMAIL ?? 'assessment@labuta.com'
const LABUTA_EMAIL = process.env.LABUTA_NOTIFICATION_EMAIL ?? 'oilabutalabs@gmail.com'

export async function sendResultEmail(params: {
  to: string
  name: string
  resultId: string
  narrativeText: string
  tipologiasNames: string[]
}): Promise<void> {
  const { renderResultEmail } = await import('./templates')
  await resend.emails.send({
    from: FROM,
    to: params.to,
    subject: 'Sua leitura sistêmica — Labuta Labs',
    html: renderResultEmail(params),
  })
}

export async function sendNotificationEmail(params: {
  leadName: string
  leadEmail: string
  resultId: string
  activatedNodes: { label: string; intensity: number }[]
  tipologiasNames: string[]
  narrativeText: string
}): Promise<void> {
  const { renderNotificationEmail } = await import('./templates')
  await resend.emails.send({
    from: FROM,
    to: LABUTA_EMAIL,
    subject: `Novo assessment — ${params.leadName}`,
    html: renderNotificationEmail(params),
  })
}
```

- [ ] **Criar `src/lib/email/templates.ts`**

```typescript
export function renderResultEmail(params: {
  name: string
  resultId: string
  narrativeText: string
  tipologiasNames: string[]
}): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://assessment.labuta.com'
  const resultUrl = `${baseUrl}/assessment/result/${params.resultId}`

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1f2937;">
  <div style="margin-bottom: 24px;">
    <span style="color: #8b5cf6; font-weight: 700; font-size: 14px; letter-spacing: 2px;">LABUTA LABS</span>
  </div>
  <h1 style="font-size: 22px; font-weight: 700; margin-bottom: 8px;">Sua leitura sistêmica, ${params.name}</h1>
  <p style="color: #6b7280; margin-bottom: 24px;">Esta é uma leitura possível do sistema que você opera — não a única.</p>
  <div style="background: #f5f3ff; border-left: 4px solid #8b5cf6; padding: 16px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
    <p style="margin: 0; line-height: 1.6; color: #374151;">${params.narrativeText}</p>
  </div>
  <p style="margin-bottom: 8px; font-weight: 600; color: #374151;">Tipologias de intervenção identificadas:</p>
  <ul style="margin-bottom: 24px; color: #6b7280;">
    ${params.tipologiasNames.map(n => `<li style="margin-bottom: 4px;">${n}</li>`).join('')}
  </ul>
  <a href="${resultUrl}" style="display: inline-block; background: #8b5cf6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
    Ver leitura completa →
  </a>
  <p style="margin-top: 32px; font-size: 12px; color: #9ca3af;">
    Labuta Labs · <a href="https://labuta.com" style="color: #8b5cf6;">labuta.com</a>
  </p>
</body>
</html>
  `.trim()
}

export function renderNotificationEmail(params: {
  leadName: string
  leadEmail: string
  resultId: string
  activatedNodes: { label: string; intensity: number }[]
  tipologiasNames: string[]
  narrativeText: string
}): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://assessment.labuta.com'
  const resultUrl = `${baseUrl}/assessment/result/${params.resultId}`

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"></head>
<body style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1f2937;">
  <h2 style="font-size: 18px;">Novo assessment — ${params.leadName}</h2>
  <p><strong>Email:</strong> ${params.leadEmail}</p>
  <p><strong>Nós ativados:</strong></p>
  <ul>
    ${params.activatedNodes.map(n => `<li>${n.label}: ${(n.intensity * 100).toFixed(0)}%</li>`).join('')}
  </ul>
  <p><strong>Tipologias sugeridas:</strong> ${params.tipologiasNames.join(', ')}</p>
  <p><strong>Leitura gerada:</strong></p>
  <blockquote style="border-left: 3px solid #8b5cf6; padding-left: 12px; color: #6b7280;">${params.narrativeText}</blockquote>
  <a href="${resultUrl}">Ver resultado completo →</a>
</body>
</html>
  `.trim()
}
```

- [ ] **Adicionar `NEXT_PUBLIC_BASE_URL` no `.env.example`**

```bash
echo "NEXT_PUBLIC_BASE_URL=https://assessment.labuta.com" >> .env.example
```

- [ ] **Commit**

```bash
git add src/lib/email/ package.json package-lock.json .env.example
git commit -m "feat: add resend email client and templates"
```

---

## Task 10: API Route — Submit

**Files:**
- Create: `src/app/api/assessment/submit/route.ts`
- Create: `src/app/api/assessment/result/[id]/route.ts`

- [ ] **Criar `src/app/api/assessment/submit/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { calculateActivatedNodes } from '@/lib/assessment/scoring'
import { mapToTipologias } from '@/lib/assessment/mapeamento'
import { ASSESSMENT_NODES } from '@/lib/assessment/content'
import { generateLeituraSistemica } from '@/lib/ai/orgDesigner'
import { getTipologiasByIds } from '@/lib/assessment/tipologias'
import { sendResultEmail, sendNotificationEmail } from '@/lib/email/resend'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const SubmitSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  marketing_consent: z.boolean().default(false),
  responses: z.record(z.record(z.enum(['ressoa', 'nao_tanto']))),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = SubmitSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, { status: 400 })
    }

    const { name, email, marketing_consent, responses } = parsed.data

    // 1. Calcular padrão de ativação
    const activatedNodes = calculateActivatedNodes(responses, ASSESSMENT_NODES)
    const tipologiasIds = mapToTipologias(activatedNodes)

    // 2. Gerar leitura via agente
    const narrativeText = await generateLeituraSistemica({ activatedNodes, suggestedTipologias: tipologiasIds })

    // 3. Salvar no Supabase
    const { data, error } = await supabase
      .from('assessment_responses')
      .insert({
        name,
        email,
        marketing_consent,
        responses,
        activated_nodes: activatedNodes,
        narrative_text: narrativeText,
        tipologias_ids: tipologiasIds,
      })
      .select('id')
      .single()

    if (error || !data) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: 'Erro ao salvar resultado' }, { status: 500 })
    }

    const resultId = data.id
    const tipologias = getTipologiasByIds(tipologiasIds)
    const tipologiasNames = tipologias.map(t => t.name)

    // 4. Enviar emails (em paralelo, sem bloquear resposta se falhar)
    Promise.all([
      sendResultEmail({ to: email, name, resultId, narrativeText, tipologiasNames }),
      sendNotificationEmail({ leadName: name, leadEmail: email, resultId, activatedNodes, tipologiasNames, narrativeText }),
    ]).then(async () => {
      await supabase
        .from('assessment_responses')
        .update({ notification_sent: true, result_email_sent: true })
        .eq('id', resultId)
    }).catch(err => console.error('Email error (non-blocking):', err))

    return NextResponse.json({ id: resultId })
  } catch (err) {
    console.error('Submit error:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
```

- [ ] **Criar `src/app/api/assessment/result/[id]/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { data, error } = await supabase
    .from('assessment_responses')
    .select('id, created_at, name, activated_nodes, narrative_text, tipologias_ids')
    .eq('id', params.id)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Resultado não encontrado' }, { status: 404 })
  }

  return NextResponse.json(data)
}
```

- [ ] **Commit**

```bash
git add src/app/api/
git commit -m "feat: add assessment submit and result API routes"
```

---

## Task 11: Landing Page

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Atualizar `src/app/page.tsx`**

```tsx
import Link from 'next/link'

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-labuta-50 to-white">
      <div className="max-w-2xl mx-auto px-6 py-20 flex flex-col items-center text-center">
        <p className="text-labuta-600 font-bold text-sm tracking-widest uppercase mb-6">
          LABUTA LABS
        </p>
        <h1 className="text-4xl font-bold text-gray-900 mb-6 leading-tight">
          Leitura Sistêmica da<br />sua Organização
        </h1>
        <p className="text-lg text-gray-600 mb-4 max-w-lg leading-relaxed">
          Não é um teste. É um mapa de pontos de alavancagem do sistema que você opera
          — e de onde pode valer a pena experimentar.
        </p>
        <div className="flex gap-6 text-sm text-gray-500 mb-10">
          <span>⏱ ~10 min</span>
          <span>🔓 Gratuito</span>
          <span>📋 Sem cadastro pra começar</span>
        </div>
        <Link
          href="/assessment"
          className="bg-labuta-500 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-labuta-600 transition-colors"
        >
          Começar mapeamento →
        </Link>
      </div>
    </main>
  )
}
```

- [ ] **Verificar que `labuta-500` está no Tailwind config**

```bash
cat tailwind.config.js
```

Se não houver a cor labuta, adicionar em `theme.extend.colors`:

```js
colors: {
  labuta: {
    50: '#f5f3ff',
    100: '#ede9fe',
    500: '#8b5cf6',
    600: '#7c3aed',
    900: '#4c1d95',
  }
}
```

- [ ] **Rodar e verificar visualmente**

```bash
npm run dev
```

Abrir `http://localhost:3000` e confirmar que a landing aparece corretamente.

- [ ] **Commit**

```bash
git add src/app/page.tsx tailwind.config.js
git commit -m "feat: add landing page"
```

---

## Task 12: Componente GrafoNode

**Files:**
- Create: `src/components/grafo/GrafoNode.tsx`

- [ ] **Criar `src/components/grafo/GrafoNode.tsx`**

```tsx
'use client'

import type { AssessmentNode, ResponseMap } from '@/lib/assessment/types'

interface Props {
  node: AssessmentNode
  responses: ResponseMap
  isActive: boolean   // nó selecionado atualmente
  onClick: (nodeId: string) => void
}

function getIntensity(node: AssessmentNode, responses: ResponseMap): number {
  const nodeResponses = responses[node.id]
  if (!nodeResponses) return 0
  const total = node.narratives.length
  const ressoaCount = Object.values(nodeResponses).filter(r => r === 'ressoa').length
  return ressoaCount / total
}

function getAnsweredCount(node: AssessmentNode, responses: ResponseMap): number {
  return Object.keys(responses[node.id] ?? {}).length
}

export function GrafoNode({ node, responses, isActive, onClick }: Props) {
  const intensity = getIntensity(node, responses)
  const answered = getAnsweredCount(node, responses)
  const isCompleted = answered === node.narratives.length

  // Cor base → mais escura conforme intensity
  const fillColor = intensity > 0.6
    ? '#6d28d9'
    : intensity > 0.3
    ? '#8b5cf6'
    : '#a78bfa'
  const fillOpacity = 0.4 + intensity * 0.6
  const strokeColor = isActive ? '#4c1d95' : (isCompleted ? '#6d28d9' : 'transparent')
  const r = 22

  return (
    <g
      className="cursor-pointer select-none"
      onClick={() => onClick(node.id)}
      role="button"
      aria-label={`Nó: ${node.label}`}
    >
      {/* Anel de seleção ativo */}
      {isActive && (
        <circle
          cx={node.x}
          cy={node.y}
          r={r + 6}
          fill="none"
          stroke="#8b5cf6"
          strokeWidth={2}
          strokeDasharray="4 3"
          opacity={0.7}
        />
      )}
      {/* Círculo principal */}
      <circle
        cx={node.x}
        cy={node.y}
        r={r}
        fill={fillColor}
        fillOpacity={fillOpacity}
        stroke={strokeColor}
        strokeWidth={2}
      />
      {/* Label */}
      <text
        x={node.x}
        y={node.y + 5}
        textAnchor="middle"
        fontSize={10}
        fontWeight="600"
        fill="white"
        pointerEvents="none"
      >
        {node.label}
      </text>
      {/* Indicador de respondido */}
      {isCompleted && (
        <text x={node.x + r - 6} y={node.y - r + 6} fontSize={10}>✓</text>
      )}
    </g>
  )
}
```

- [ ] **Commit**

```bash
git add src/components/grafo/GrafoNode.tsx
git commit -m "feat: add GrafoNode component with visual states"
```

---

## Task 13: Componente NarrativaPanel

**Files:**
- Create: `src/components/grafo/NarrativaPanel.tsx`

- [ ] **Criar `src/components/grafo/NarrativaPanel.tsx`**

```tsx
'use client'

import type { AssessmentNode, ResponseMap, NarrativeResponse } from '@/lib/assessment/types'

interface Props {
  node: AssessmentNode
  responses: ResponseMap
  onAnswer: (nodeId: string, narrativeId: string, response: NarrativeResponse) => void
}

export function NarrativaPanel({ node, responses, onAnswer }: Props) {
  const nodeResponses = responses[node.id] ?? {}

  // Mostrar a primeira narrativa não respondida, ou a última se todas respondidas
  const unanswered = node.narratives.filter(n => !nodeResponses[n.id])
  const current = unanswered[0] ?? node.narratives[node.narratives.length - 1]
  const answeredCount = Object.keys(nodeResponses).length
  const isComplete = answeredCount === node.narratives.length

  return (
    <div className="bg-white rounded-2xl border border-purple-100 p-5 flex flex-col gap-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-labuta-600 font-semibold text-sm">📍 {node.label}</span>
        <span className="text-gray-400 text-xs">
          {answeredCount} de {node.narratives.length}
        </span>
      </div>

      {isComplete ? (
        <div className="text-center py-4">
          <p className="text-labuta-600 font-semibold mb-1">✓ Nó explorado</p>
          <p className="text-gray-500 text-sm">Clique em outro nó para continuar.</p>
        </div>
      ) : (
        <>
          <div className="bg-purple-50 border-l-4 border-labuta-500 rounded-r-lg p-4">
            <p className="text-gray-700 text-sm leading-relaxed italic">
              "{current.text}"
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => onAnswer(node.id, current.id, 'ressoa')}
              className="flex-1 bg-labuta-500 text-white rounded-xl py-3 font-semibold text-sm hover:bg-labuta-600 transition-colors"
            >
              Ressoa
            </button>
            <button
              onClick={() => onAnswer(node.id, current.id, 'nao_tanto')}
              className="flex-1 bg-gray-100 text-gray-700 rounded-xl py-3 font-semibold text-sm hover:bg-gray-200 transition-colors"
            >
              Não tanto
            </button>
          </div>
        </>
      )}

      {/* Histórico de respostas do nó */}
      {answeredCount > 0 && (
        <div className="flex flex-col gap-1">
          {node.narratives.filter(n => nodeResponses[n.id]).map(n => (
            <div key={n.id} className="flex items-start gap-2 text-xs text-gray-400">
              <span>{nodeResponses[n.id] === 'ressoa' ? '●' : '○'}</span>
              <span className="line-clamp-1">{n.text.slice(0, 60)}…</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Commit**

```bash
git add src/components/grafo/NarrativaPanel.tsx
git commit -m "feat: add NarrativaPanel component"
```

---

## Task 14: Componente GrafoCanvas

**Files:**
- Create: `src/components/grafo/GrafoCanvas.tsx`

- [ ] **Criar `src/components/grafo/GrafoCanvas.tsx`**

```tsx
'use client'

import { ASSESSMENT_NODES, CENTER_NODE, SVG_WIDTH, SVG_HEIGHT } from '@/lib/assessment/content'
import type { ResponseMap } from '@/lib/assessment/types'
import { GrafoNode } from './GrafoNode'

interface Props {
  responses: ResponseMap
  activeNodeId: string | null
  onNodeClick: (nodeId: string) => void
}

export function GrafoCanvas({ responses, activeNodeId, onNodeClick }: Props) {
  return (
    <svg
      width="100%"
      viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
      className="w-full max-w-lg mx-auto"
      aria-label="Grafo de pontos de alavancagem"
    >
      {/* Linhas de conexão (nó central → nós periféricos) */}
      {ASSESSMENT_NODES.map(node => {
        const nodeResponses = responses[node.id] ?? {}
        const answered = Object.keys(nodeResponses).length
        const isAnswered = answered > 0
        return (
          <line
            key={`line-${node.id}`}
            x1={CENTER_NODE.x}
            y1={CENTER_NODE.y}
            x2={node.x}
            y2={node.y}
            stroke={isAnswered ? '#8b5cf6' : '#e5e7eb'}
            strokeWidth={isAnswered ? 2 : 1.5}
            opacity={isAnswered ? 0.7 : 0.4}
          />
        )
      })}

      {/* Nó central decorativo */}
      <circle cx={CENTER_NODE.x} cy={CENTER_NODE.y} r={14} fill="#8b5cf6" opacity={0.15} />
      <text
        x={CENTER_NODE.x}
        y={CENTER_NODE.y + 4}
        textAnchor="middle"
        fontSize={8}
        fill="#6d28d9"
        fontWeight="600"
      >
        SISTEMA
      </text>

      {/* Nós periféricos */}
      {ASSESSMENT_NODES.map(node => (
        <GrafoNode
          key={node.id}
          node={node}
          responses={responses}
          isActive={activeNodeId === node.id}
          onClick={onNodeClick}
        />
      ))}
    </svg>
  )
}
```

- [ ] **Commit**

```bash
git add src/components/grafo/GrafoCanvas.tsx
git commit -m "feat: add GrafoCanvas SVG component"
```

---

## Task 15: Assessment Page (Grafo Navegável)

**Files:**
- Create: `src/app/assessment/page.tsx`

- [ ] **Criar `src/app/assessment/page.tsx`**

```tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { GrafoCanvas } from '@/components/grafo/GrafoCanvas'
import { NarrativaPanel } from '@/components/grafo/NarrativaPanel'
import { ASSESSMENT_NODES } from '@/lib/assessment/content'
import type { ResponseMap, NarrativeResponse } from '@/lib/assessment/types'

const STORAGE_KEY = 'labuta_assessment_responses'

export default function AssessmentPage() {
  const router = useRouter()
  const [responses, setResponses] = useState<ResponseMap>({})
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null)

  // Restaurar estado do sessionStorage ao recarregar
  useEffect(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY)
    if (saved) {
      try { setResponses(JSON.parse(saved)) } catch { /* ignore */ }
    }
  }, [])

  const handleAnswer = (nodeId: string, narrativeId: string, response: NarrativeResponse) => {
    setResponses(prev => {
      const updated = {
        ...prev,
        [nodeId]: { ...(prev[nodeId] ?? {}), [narrativeId]: response },
      }
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
  }

  const handleNodeClick = (nodeId: string) => {
    setActiveNodeId(prev => (prev === nodeId ? null : nodeId))
  }

  const activeNode = ASSESSMENT_NODES.find(n => n.id === activeNodeId)

  // Contar nós com ao menos 1 resposta
  const exploredCount = Object.keys(responses).filter(
    nodeId => Object.keys(responses[nodeId] ?? {}).length > 0
  ).length

  const canProceed = exploredCount >= 1

  return (
    <main className="min-h-screen bg-gradient-to-br from-labuta-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="text-center mb-8">
          <p className="text-labuta-600 font-bold text-xs tracking-widest uppercase mb-2">LABUTA LABS</p>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Explore os pontos de alavancagem</h1>
          <p className="text-gray-500 text-sm">
            Clique nos nós que ressoam com seu contexto. Explore quantos quiser.
          </p>
          <p className="text-gray-400 text-xs mt-1">
            {exploredCount} de {ASSESSMENT_NODES.length} nós explorados
          </p>
        </div>

        {/* Layout principal */}
        <div className="flex flex-col lg:flex-row gap-8 items-start justify-center">
          {/* Grafo */}
          <div className="w-full lg:w-1/2">
            <GrafoCanvas
              responses={responses}
              activeNodeId={activeNodeId}
              onNodeClick={handleNodeClick}
            />
          </div>

          {/* Painel lateral */}
          <div className="w-full lg:w-80">
            {activeNode ? (
              <NarrativaPanel
                node={activeNode}
                responses={responses}
                onAnswer={handleAnswer}
              />
            ) : (
              <div className="bg-white rounded-2xl border border-purple-100 p-6 text-center">
                <p className="text-gray-400 text-sm leading-relaxed">
                  Clique em um nó no grafo para explorar as narrativas desse ponto de alavancagem.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* CTA para ver resultado */}
        {canProceed && (
          <div className="text-center mt-10">
            <button
              onClick={() => router.push('/assessment/gate')}
              className="bg-labuta-500 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-labuta-600 transition-colors"
            >
              Ver minha leitura sistêmica →
            </button>
            <p className="text-gray-400 text-xs mt-2">
              Você pode continuar explorando antes de prosseguir.
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
```

- [ ] **Commit**

```bash
git add src/app/assessment/page.tsx
git commit -m "feat: add assessment grafo page with session state"
```

---

## Task 16: Email Gate Page

**Files:**
- Create: `src/app/assessment/gate/page.tsx`

- [ ] **Criar diretório e arquivo**

```bash
mkdir -p src/app/assessment/gate
```

- [ ] **Criar `src/app/assessment/gate/page.tsx`**

```tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { ResponseMap } from '@/lib/assessment/types'

const STORAGE_KEY = 'labuta_assessment_responses'

export default function GatePage() {
  const router = useRouter()
  const [responses, setResponses] = useState<ResponseMap>({})
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [consent, setConsent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY)
    if (!saved) { router.replace('/assessment'); return }
    try { setResponses(JSON.parse(saved)) } catch { router.replace('/assessment') }
  }, [router])

  const exploredCount = Object.keys(responses).filter(
    nodeId => Object.keys(responses[nodeId] ?? {}).length > 0
  ).length

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/assessment/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, marketing_consent: consent, responses }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Erro ao processar')
      }

      const { id } = await res.json()
      sessionStorage.removeItem(STORAGE_KEY)
      router.push(`/assessment/result/${id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Algo deu errado. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-labuta-50 to-white flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-purple-100 p-8 w-full max-w-md">
        <p className="text-labuta-600 font-bold text-xs tracking-widest uppercase mb-4">LABUTA LABS</p>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          A leitura do seu sistema está pronta
        </h1>
        <p className="text-gray-500 text-sm mb-6">
          Identificamos{' '}
          <span className="text-labuta-600 font-semibold">{exploredCount} ponto{exploredCount !== 1 ? 's' : ''} de alavancagem</span>{' '}
          no seu sistema. Deixa seu contato para ver a leitura completa.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Seu nome"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            className="border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-labuta-500 focus:ring-1 focus:ring-labuta-500"
          />
          <input
            type="email"
            placeholder="Seu email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-labuta-500 focus:ring-1 focus:ring-labuta-500"
          />
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={consent}
              onChange={e => setConsent(e.target.checked)}
              className="mt-0.5 accent-labuta-500"
            />
            <span className="text-xs text-gray-500 leading-relaxed">
              Quero receber conteúdos sobre design organizacional da Labuta Labs.
            </span>
          </label>

          {error && (
            <p className="text-red-500 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="bg-labuta-500 text-white rounded-xl py-4 font-semibold hover:bg-labuta-600 transition-colors disabled:opacity-60"
          >
            {loading ? 'Gerando sua leitura…' : 'Ver minha leitura sistêmica →'}
          </button>
        </form>

        <p className="text-xs text-gray-400 mt-4 text-center">
          Sem spam. Só compartilhamos leituras que possam ser úteis pra você.
        </p>
      </div>
    </main>
  )
}
```

- [ ] **Commit**

```bash
git add src/app/assessment/gate/page.tsx
git commit -m "feat: add email gate page with form and API integration"
```

---

## Task 17: Componentes de Resultado

**Files:**
- Create: `src/components/resultado/GrafoResult.tsx`
- Create: `src/components/resultado/LeituraSistemica.tsx`
- Create: `src/components/resultado/TipologiaCard.tsx`

- [ ] **Criar `src/components/resultado/GrafoResult.tsx`**

```tsx
import { ASSESSMENT_NODES, CENTER_NODE, SVG_WIDTH, SVG_HEIGHT } from '@/lib/assessment/content'
import type { ActivatedNode } from '@/lib/assessment/types'

interface Props {
  activatedNodes: ActivatedNode[]
}

export function GrafoResult({ activatedNodes }: Props) {
  const nodeIntensityMap = new Map(activatedNodes.map(n => [n.nodeId, n.intensity]))

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
      className="w-full max-w-md mx-auto"
      aria-label="Grafo com pontos de alavancagem ativados"
    >
      {ASSESSMENT_NODES.map(node => {
        const intensity = nodeIntensityMap.get(node.id) ?? 0
        return (
          <line
            key={`line-${node.id}`}
            x1={CENTER_NODE.x}
            y1={CENTER_NODE.y}
            x2={node.x}
            y2={node.y}
            stroke={intensity > 0.6 ? '#6d28d9' : '#e5e7eb'}
            strokeWidth={intensity > 0.6 ? 2.5 : 1}
            opacity={intensity > 0.6 ? 0.8 : 0.3}
          />
        )
      })}

      <circle cx={CENTER_NODE.x} cy={CENTER_NODE.y} r={14} fill="#8b5cf6" opacity={0.15} />
      <text x={CENTER_NODE.x} y={CENTER_NODE.y + 4} textAnchor="middle" fontSize={8} fill="#6d28d9" fontWeight="600">
        SISTEMA
      </text>

      {ASSESSMENT_NODES.map(node => {
        const intensity = nodeIntensityMap.get(node.id) ?? 0
        const fill = intensity > 0.6 ? '#6d28d9' : intensity > 0.3 ? '#8b5cf6' : '#a78bfa'
        const opacity = 0.2 + intensity * 0.8

        return (
          <g key={node.id}>
            <circle cx={node.x} cy={node.y} r={22} fill={fill} fillOpacity={opacity} />
            <text x={node.x} y={node.y + 5} textAnchor="middle" fontSize={10} fontWeight="600" fill="white">
              {node.label}
            </text>
            {intensity > 0 && (
              <text x={node.x} y={node.y + 38} textAnchor="middle" fontSize={9} fill="#6d28d9" opacity={0.7}>
                {(intensity * 100).toFixed(0)}%
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}
```

- [ ] **Criar `src/components/resultado/LeituraSistemica.tsx`**

```tsx
interface Props {
  narrativeText: string
}

export function LeituraSistemica({ narrativeText }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-labuta-600 font-semibold text-sm">🔍 Leitura do sistema</p>
      <div className="bg-purple-50 border-l-4 border-labuta-500 rounded-r-xl p-5">
        <p className="text-gray-700 text-sm leading-relaxed">{narrativeText}</p>
      </div>
      <div className="bg-amber-50 border-l-3 border-amber-400 rounded-r-lg px-4 py-3">
        <p className="text-amber-800 text-xs leading-relaxed">
          <strong>Uma nota sobre essa leitura:</strong> isso é uma hipótese, não um diagnóstico.
          O sistema que você opera é único — essa leitura é um ponto de partida para explorar, não uma verdade sobre o que está errado.
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Criar `src/components/resultado/TipologiaCard.tsx`**

```tsx
import type { Tipologia } from '@/lib/assessment/types'

const CATEGORY_COLORS: Record<string, string> = {
  vetorial: 'bg-blue-100 text-blue-700',
  sinalizacao: 'bg-green-100 text-green-700',
  comunicacao: 'bg-purple-100 text-purple-700',
}

const DIRECTION_ICONS = { up: '↑', down: '↓', neutral: '~' }
const DIRECTION_COLORS = { up: 'text-labuta-600', down: 'text-red-500', neutral: 'text-gray-500' }

interface Props {
  tipologia: Tipologia
  reasonText?: string   // Por que aparece no seu sistema (gerado pelo agente — futuro)
  isPrimary?: boolean
}

export function TipologiaCard({ tipologia, isPrimary = true }: Props) {
  return (
    <div className={`rounded-2xl border p-5 flex flex-col gap-4 ${isPrimary ? 'border-labuta-200 bg-purple-50' : 'border-gray-200 bg-gray-50'}`}>
      {/* Header */}
      <div className="flex items-start gap-3">
        <span className="text-3xl flex-shrink-0">{tipologia.icon}</span>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-gray-900">{tipologia.name}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[tipologia.category]}`}>
              {tipologia.categoryLabel}
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-1 leading-relaxed">{tipologia.shortDescription}</p>
        </div>
      </div>

      {/* Efeitos + Feedback (grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Efeitos */}
        <div className="bg-white rounded-xl p-4">
          <p className="text-xs font-bold text-gray-700 mb-2">⚡ Efeitos esperados</p>
          <ul className="flex flex-col gap-1">
            {tipologia.effects.map((effect, i) => (
              <li key={i} className="text-xs text-gray-600 leading-relaxed flex gap-1.5">
                <span className="text-labuta-400 flex-shrink-0">·</span>
                {effect}
              </li>
            ))}
          </ul>
        </div>
        {/* Feedback loop */}
        <div className="bg-white rounded-xl p-4">
          <p className="text-xs font-bold text-gray-700 mb-2">🔄 Feedback loop</p>
          <div className="flex flex-col gap-2 text-xs text-gray-600">
            <div className="flex gap-1.5">
              <span className="text-green-600 font-bold flex-shrink-0">+</span>
              <span>{tipologia.feedbackLoop.positive}</span>
            </div>
            <div className="flex gap-1.5">
              <span className="text-red-500 font-bold flex-shrink-0">−</span>
              <span>{tipologia.feedbackLoop.risk}</span>
            </div>
            <div className="flex gap-1.5">
              <span className="text-amber-500 font-bold flex-shrink-0">↺</span>
              <span>{tipologia.feedbackLoop.observe}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Variáveis */}
      <div>
        <p className="text-xs font-bold text-gray-700 mb-2">🧭 Variáveis que sinaliza</p>
        <div className="flex flex-wrap gap-2">
          {tipologia.variables.map((v, i) => (
            <span key={i} className="bg-white border border-gray-200 rounded-lg px-3 py-1 text-xs text-gray-700">
              <span className={`font-bold mr-1 ${DIRECTION_COLORS[v.direction]}`}>
                {DIRECTION_ICONS[v.direction]}
              </span>
              {v.name}
            </span>
          ))}
        </div>
      </div>

      {/* Experimentos */}
      <div className="bg-purple-100 rounded-xl p-4">
        <p className="text-xs font-bold text-labuta-700 mb-3">🧪 Possíveis experimentos</p>
        <div className="flex flex-col gap-3">
          {tipologia.experiments.map((exp, i) => (
            <div key={i} className="bg-white rounded-lg p-3">
              <p className="text-xs font-semibold text-gray-800 mb-1">{exp.title}</p>
              <p className="text-xs text-gray-600 leading-relaxed">{exp.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Commit**

```bash
git add src/components/resultado/
git commit -m "feat: add result components (GrafoResult, LeituraSistemica, TipologiaCard)"
```

---

## Task 18: Result Page + CTA

**Files:**
- Create: `src/app/assessment/result/[id]/page.tsx`

- [ ] **Criar diretório**

```bash
mkdir -p src/app/assessment/result/[id]
```

- [ ] **Criar `src/app/assessment/result/[id]/page.tsx`**

```tsx
import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { GrafoResult } from '@/components/resultado/GrafoResult'
import { LeituraSistemica } from '@/components/resultado/LeituraSistemica'
import { TipologiaCard } from '@/components/resultado/TipologiaCard'
import { getTipologiasByIds } from '@/lib/assessment/tipologias'
import type { ActivatedNode } from '@/lib/assessment/types'

async function getResult(id: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data, error } = await supabase
    .from('assessment_responses')
    .select('id, name, activated_nodes, narrative_text, tipologias_ids')
    .eq('id', id)
    .single()
  if (error || !data) return null
  return data
}

export default async function ResultPage({ params }: { params: { id: string } }) {
  const result = await getResult(params.id)
  if (!result) notFound()

  const activatedNodes = (result.activated_nodes ?? []) as ActivatedNode[]
  const tipologias = getTipologiasByIds(result.tipologias_ids ?? [])
  const topTipologias = tipologias.slice(0, 2)
  const secondaryTipologias = tipologias.slice(2)

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://assessment.labuta.com'
  const shareUrl = `${baseUrl}/assessment/result/${result.id}`

  return (
    <main className="min-h-screen bg-gradient-to-br from-labuta-50 to-white">
      <div className="max-w-3xl mx-auto px-4 py-12 flex flex-col gap-10">
        {/* Header */}
        <div className="text-center">
          <p className="text-labuta-600 font-bold text-xs tracking-widest uppercase mb-2">LABUTA LABS</p>
          <h1 className="text-2xl font-bold text-gray-900">
            Sua leitura sistêmica{result.name ? `, ${result.name.split(' ')[0]}` : ''}
          </h1>
        </div>

        {/* Bloco A: Grafo ativado */}
        <div>
          <p className="text-labuta-600 font-semibold text-sm mb-4">Pontos de alavancagem identificados</p>
          <GrafoResult activatedNodes={activatedNodes} />
        </div>

        {/* Bloco B: Leitura narrativa */}
        <LeituraSistemica narrativeText={result.narrative_text ?? ''} />

        {/* Bloco C: Tipologias */}
        {tipologias.length > 0 && (
          <div className="flex flex-col gap-6">
            <p className="text-labuta-600 font-semibold text-sm">Onde pode valer experimentar — tipologias de intervenção</p>
            {topTipologias.map(t => (
              <TipologiaCard key={t.id} tipologia={t} isPrimary />
            ))}
            {secondaryTipologias.map(t => (
              <TipologiaCard key={t.id} tipologia={t} isPrimary={false} />
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="bg-white rounded-2xl border border-purple-100 p-8 text-center flex flex-col gap-4">
          <h2 className="text-xl font-bold text-gray-900">
            Isso ressou com algo que você está vivendo?
          </h2>
          <p className="text-gray-500 text-sm max-w-md mx-auto leading-relaxed">
            A Labuta trabalha com organizações explorando esses pontos de alavancagem
            através de experimentos estruturados — não consultoria tradicional.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <a
              href="https://labuta.com/contato"
              className="bg-labuta-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-labuta-600 transition-colors text-sm"
            >
              Conversar com a Labuta →
            </a>
            <button
              onClick={() => navigator.clipboard?.writeText(shareUrl)}
              className="bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors text-sm"
            >
              Compartilhar leitura
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
```

- [ ] **Commit**

```bash
git add src/app/assessment/result/
git commit -m "feat: add result page with grafo, narrative, tipologias and CTA"
```

---

## Task 19: Build Final + Deploy

**Files:**
- Modify: `next.config.js` (se necessário)

- [ ] **Rodar todos os testes**

```bash
npm test
```

Esperado: todos passando.

- [ ] **Verificar tipos**

```bash
npm run type-check
```

Esperado: sem erros.

- [ ] **Build de produção**

```bash
npm run build
```

Esperado: build bem-sucedido, sem erros.

- [ ] **Configurar variáveis no Vercel**

No painel da Vercel, adicionar todas as variáveis do `.env.example`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `LABUTA_NOTIFICATION_EMAIL`
- `LABUTA_ORG_DESIGNER_PROMPT`
- `NEXT_PUBLIC_BASE_URL`

- [ ] **Push para main (trigger deploy automático)**

```bash
git push origin main
```

- [ ] **Testar o fluxo completo em produção**

1. Abrir `assessment.labuta.com`
2. Clicar em "Começar mapeamento"
3. Explorar ao menos 1 nó, responder 1 narrativa
4. Clicar em "Ver minha leitura sistêmica"
5. Preencher nome + email
6. Verificar que o resultado aparece com grafo, leitura e tipologias
7. Verificar email de resultado na caixa do lead
8. Verificar email de notificação em `oilabutalabs@gmail.com`
9. Verificar registro criado no Supabase

---

## Spec Coverage Check

| Requisito do Spec | Task |
|---|---|
| Landing page com posicionamento correto | Task 11 |
| Grafo navegável com nós clicáveis | Tasks 12, 13, 14, 15 |
| Micro-narrativas por nó (Ressoa / Não tanto) | Task 13 |
| Estados visuais dos nós (intensidade) | Task 12 |
| Progresso suave (nós explorados) | Task 15 |
| Email gate (Nome + Email + Consent) | Task 16 |
| Cálculo de ativação dos nós | Task 5 |
| Mapeamento nós → tipologias | Task 6 |
| Geração de leitura via agente Claude | Task 8 |
| Grafo ativado no resultado | Task 17 |
| Leitura narrativa com nota epistêmica | Task 17 |
| TipologiaCard expandido (efeitos, feedback, variáveis, experimentos) | Task 17 |
| CTA leve + compartilhar | Task 18 |
| Checkbox marketing_consent | Task 16 |
| Email de resultado para o lead | Task 9, 10 |
| Email de notificação para Labuta | Task 9, 10 |
| Schema Supabase com todos os campos | Task 2 |
| Variáveis de ambiente documentadas | Task 7 |
| Build + deploy Vercel | Task 19 |

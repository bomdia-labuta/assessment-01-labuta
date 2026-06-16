# Assessment Labuta — Design Spec (Redesign)

**Data:** 2026-06-10  
**Status:** Aprovado  
**Owner:** Thiago Dalmoro (Labuta Labs)

---

## Visão Geral

Assessment diagnóstico sobre dinâmicas organizacionais, usando um grafo visual como metáfora do sistema da empresa do lead. Objetivo: capturar leads qualificados entregando uma experiência real de valor antes de qualquer contratação.

**Fluxo completo:**
```
Landing → Assessment (9 nós livres) → Gate (nome + email) → Resultado → Email
```

O lead faz o assessment sem atrito. O formulário de captura aparece apenas no momento de revelar o resultado — quando o lead já está investido e motivado.

---

## Grafo Visual

**Biblioteca:** `react-force-graph-2d` (D3 force-directed, canvas renderer)

**Canvas:** Fundo `#0e0e12`, grid sutil com linhas `rgba(255,255,255,.022)`

**Estados dos nós:**

| Estado | Visual |
|---|---|
| Não visitado | Contorno tracejado, sem fill (fantasma) |
| Ativo (sendo respondido) | Pulsa com glow na cor do nó |
| Visitado — Sim (1.0) | Fill sólido, tamanho grande, brilho máximo |
| Visitado — Um pouco (0.5) | Fill opacidade 60%, tamanho médio |
| Visitado — Não (0.0) | Fill opacidade 20%, tamanho pequeno |

**Paleta dos 9 nós:**

| Nó | Cor |
|---|---|
| Tomada de decisão | `#3355dd` |
| Papéis e responsabilidades | `#DF4B19` |
| Comunicação | `#FAE063` |
| Poder e influência | `#e07820` |
| Conflitos entre áreas | `#9966dd` |
| Conversas difíceis | `#f08898` |
| Mudança e adaptação | `#2dd4bf` |
| Trabalho invisível | `#4ade80` |
| Ritos e reuniões | `#38bdf8` |

**Conexões:** Emergem quando dois nós com score > 0 compartilham uma `#tag` em comum (de micronarrativas ou input livre). Linha fina, cor interpolada entre os dois nós conectados, opacidade proporcional à força da conexão.

---

## Fluxo de Steps

**Roteamento:** `/assessment/[step]` — step é índice 0–8.

A ordem dos 9 nós é randomizada uma vez no início da sessão e salva em `sessionStorage`.

**Layout de cada step:**

```
┌─────────────────────────────────────────────────────┐
│  Barra de progresso (9 nós como pontos)             │
├──────────────────────┬──────────────────────────────┤
│                      │  [Título do nó]              │
│   Grafo interativo   │                              │
│   (nó ativo pulsa)   │  Narrativa 1                 │
│                      │  Narrativa 2                 │
│   Conexões emergem   │  Narrativa 3                 │
│   em tempo real      │                              │
│                      │  ○ Sim  ○ Um pouco  ○ Não   │
│                      │                              │
│                      │  [Campo livre opcional]      │
│                      │                              │
│                      │  [Próximo →]                 │
└──────────────────────┴──────────────────────────────┘
```

---

## Micronarrativas

- Pool de 6–8 seeds por nó, armazenadas no Supabase (`narratives` table) com `#tags` pré-definidas
- Claude gera variações a partir das seeds (tom: 1ª pessoa, direto, sem jargão, captura tensão sem dramatizar)
- Variações cacheadas — não regeneradas a cada acesso
- A cada sessão: 3 narrativas sorteadas aleatoriamente por nó → experiência única

**Seeds existentes (nó Trabalho invisível / Papéis):**
- "Se a gente não aciona, não acontece. Fomos virando a ponte entre áreas que deveriam se conversar sozinhas." `#trabalho-invisível #papéis`
- "Quando falta peça na estrutura, quem está mais perto do buraco vai tapando. Fico tão dentro do operacional que perco a visão do sistema de fora — que era exatamente o meu papel." `#papéis #sobrecarga #trabalho-invisível`

---

## Input Livre

Campo de texto opcional em cada nó, após as micronarrativas.

**Processamento:**
- `onBlur` dispara chamada à Claude API (`claude-haiku-4-5-20251001` — modelo leve)
- Prompt classifica o texto e retorna array de `#tags` do vocabulário do sistema
- Tags retornadas atualizam o estado do nó e disparam atualização de conexões no grafo em tempo real
- **Fallback:** se Claude falhar ou timeout, input é salvo mesmo assim e tags processadas assincronamente após o submit do gate

---

## Escala de Resposta

| Opção | Peso |
|---|---|
| Sim | 1.0 |
| Um pouco | 0.5 |
| Não | 0.0 |

---

## Persistência Durante o Fluxo

- Estado do assessment (respostas, tags, scores parciais) em `localStorage` — protege contra refresh acidental
- `response` no Supabase criado com UUID no início (sem email/nome)
- Sincronizado com Supabase apenas no submit do gate

---

## Gate

Tela após o 9º nó. Grafo completo ao fundo, levemente desfocado — visível mas inacessível.

**Copy:** *"Seu mapa está pronto. Para ver a leitura completa, deixa seu contato."*

**Campos:** Nome + Email → botão "Ver resultado"

**Ao submit:**
1. Atualiza `response` no Supabase com nome, email, respostas, scores, tags
2. Captura screenshot do grafo (`canvas.toDataURL()` → salva no Supabase Storage)
3. Gera leitura sistêmica via Claude (streaming, aparece progressivamente)
4. Redireciona para `/assessment/result/[uuid]`
5. Envia email via Resend em background (não bloqueia o redirect)

---

## Página de Resultado

**URL:** `/assessment/result/[uuid]` — permanente, compartilhável

**Estrutura:**

```
┌─────────────────────────────────────────────────────┐
│  Grafo final (interativo, nós clicáveis)            │
│  Leitura sistêmica (gerada pelo Claude, streaming)  │
├─────────────────────────────────────────────────────┤
│  [Recomendação] [Alternativa] [Ver todas]  ← tabs   │
├─────────────────────────────────────────────────────┤
│  Tab ativa: card da tipologia                       │
│  → Nome, descrição, 3 pontos de atenção, CTA        │
└─────────────────────────────────────────────────────┘
```

---

## Tipologias e Scoring

**Score de cada nó:** média ponderada das 3 respostas + boost leve por tags do input livre.

**Assinatura:** top 3 nós por score. Cada combinação mapeia para uma tipologia pré-definida.

Exemplos:

| Assinatura (top 3 nós) | Tipologia |
|---|---|
| Decisão + Poder + Conflitos | "O Sistema Travado" |
| Comunicação + Trabalho invisível + Papéis | "A Organização Silenciosa" |
| Mudança + Conversas difíceis + Ritos | "Em Transição" |

**Leitura sistêmica:** gerada pelo Claude com contexto dos scores de todos os 9 nós + tags coletadas + tipologia recomendada. Prompt fornecido pela Labuta (tom: direto, sem jargão, sem dramatizar). Entregue via streaming para aparecer progressivamente.

---

## Email (Resend)

Enviado em background após submit do gate. Não bloqueia o redirect.

**Estrutura:**
```
[Preview do grafo — imagem do canvas salva no Supabase Storage]

Olá, [Nome].
Aqui está o seu mapa organizacional.

[Ver resultado completo →]

──────────────────────
Labuta Labs
```

- Template em React Email
- Imagem do grafo: URL pública do Supabase Storage (capturada no submit)
- Link permanente para `/assessment/result/[uuid]`
- Sem PDF, sem exportação

**Fallback:** se envio falhar, o resultado já está acessível pela URL.

---

## Schema Supabase

Convenções: prefixo `assessment_`, snake_case, UUID com `gen_random_uuid()`, RLS habilitado em todas as tabelas, nomes em português. Ver migrations em `supabase/migrations/`.

```sql
-- 001_assessment_typologies.sql
CREATE TABLE assessment_typologies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  nome TEXT NOT NULL,
  descricao TEXT,
  assinatura_nos TEXT[],   -- slugs dos top 3 nós
  pontos_atencao TEXT[],   -- 3 pontos de atenção
  cta TEXT
);

-- 002_assessment_narratives.sql
CREATE TABLE assessment_narratives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  node_slug TEXT NOT NULL,   -- ex: 'trabalho-invisivel'
  seed_text TEXT NOT NULL,
  variations JSONB,          -- variações geradas pelo Claude (cacheadas)
  tags TEXT[]
);

-- 003_assessment_responses.sql
CREATE TABLE assessment_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  name TEXT,                   -- nullable: preenchido no gate
  email TEXT,                  -- nullable: preenchido no gate
  marketing_consent BOOLEAN DEFAULT false,
  node_scores JSONB,           -- { node_slug: score }
  node_tags JSONB,             -- { node_slug: [tags] }
  selected_narratives JSONB,   -- { node_slug: [narrative_ids] }
  free_inputs JSONB,           -- { node_slug: "texto livre" }
  tipologia_id UUID REFERENCES assessment_typologies(id),
  leitura_sistemica TEXT,
  graph_image_url TEXT,
  result_shared BOOLEAN DEFAULT false,
  result_email_sent BOOLEAN DEFAULT false
);
```

---

## Abordagem de Implementação

**Incremental por camada — ordem de desenvolvimento:**

1. Schema Supabase + seeding de narrativas e tipologias
2. Componente de grafo (`react-force-graph-2d`) com estado local
3. Fluxo de assessment (steps, escala, input livre, processamento de tags)
4. Gate + integração Supabase (salvar response)
5. Página de resultado (grafo + leitura sistêmica streaming + tabs)
6. Email (Resend + React Email + screenshot)
7. Testes E2E + deploy Vercel

---

## Fora de Escopo (MVP)

- Admin dashboard
- Analytics avançada
- Múltiplas línguas
- Gamification
- Exportação PDF

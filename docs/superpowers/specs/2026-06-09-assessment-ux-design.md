# Assessment Leads Labuta — Design Spec
**Data:** 2026-06-09  
**Status:** Aprovado  
**Owner:** Thiago Dalmoro (Labuta Labs)

---

## Visão e intenção

O assessment não é um teste de maturidade. É um **espelho sistêmico**: o lead navega por micro-narrativas organizacionais, reconhece o que ressoa com seu contexto, e o sistema devolve uma **leitura possível** do que emerge desse padrão.

O objetivo não é diagnosticar — é ajudar a pessoa a ver o sistema que opera com outros olhos. Se essa leitura ressoa, o CTA é natural: "quer explorar isso com a Labuta?"

A linguagem do resultado é de org design: não há uma análise única, há uma ótica. A leitura acolhe a complexidade e o pensamento sistêmico. Ela é escrita pelo **Agente Labuta Org Designer**, não por um algoritmo de scoring.

---

## Fluxo completo — 5 telas

```
Landing → Grafo Navegável → Email Gate → Resultado → CTA
```

### Tela 1 — Landing

- Título: "Leitura Sistêmica da sua Organização" (ou variação)
- Posicionamento: não é um teste, é um mapeamento
- Metadados: ~10 min · gratuito · sem cadastro pra começar
- CTA único: "Começar mapeamento →"

### Tela 2 — Grafo Navegável

O coração do assessment. O lead navega o grafo clicando nos nós que ressoam com seu contexto.

**Estrutura do grafo:**
- Nó central: o sistema/organização como entidade
- 4–6 nós periféricos: pontos de alavancagem (conteúdo TBD — definido separadamente)
- Cada nó contém 2–3 micro-narrativas (conteúdo TBD — definido separadamente)

**Interação:**
- Lead clica num nó → painel lateral abre com a primeira micro-narrativa do nó
- Micro-narrativa é uma frase curta descrevendo uma situação organizacional real (ex: "As decisões importantes acontecem em conversas informais, fora das reuniões formais.")
- Lead responde: **"Ressoa"** / **"Não tanto"**
- Após responder todas as micro-narrativas de um nó, o nó fica visivelmente mais intenso/escuro no grafo
- Lead pode navegar livremente entre os nós (não-linear)
- Nós com mais respostas "Ressoa" ficam mais destacados visualmente

**Estados visuais dos nós:**
- Inativo: cor base, baixa opacidade
- Em exploração: destaque com borda tracejada
- Ativado (≥1 "Ressoa"): mais escuro
- Fortemente ativado (maioria "Ressoa"): cor plena + peso visual maior

**Progresso:** indicador suave (ex: "X de Y nós explorados") — sem barra rígida de progresso

### Tela 3 — Email Gate

Um botão **"Ver minha leitura sistêmica"** aparece fixo na interface assim que o lead responde pelo menos um nó completo. Ao clicar, o email gate é exibido — independentemente de quantos nós foram explorados. O lead não precisa completar todos os nós para prosseguir.

- Headline: "A leitura do seu sistema está pronta"
- Subtexto: quantos pontos de alavancagem foram identificados (número)
- Campos: Nome + Email
- CTA: "Ver minha leitura sistêmica →"
- Nota de privacidade: sem spam, só leituras que possam ser úteis
- Sem opção de pular — o email é obrigatório para ver o resultado

### Tela 4 — Resultado: Leitura Sistêmica

Dividida em três blocos:

#### Bloco A — Grafo ativado
- O grafo é exibido novamente, agora com os nós ativados em destaque
- Conexões entre nós fortemente ativados são realçadas (tensão sistêmica visível)
- Nós não-ativados ficam apagados/secundários

#### Bloco B — Leitura narrativa (gerada pelo Agente Labuta Org Designer)
- Texto em primeira pessoa do agente, com voz de praticante de org design
- A linguagem deixa explícito que é **uma leitura possível**, não a única
- Usa vocabulário sistêmico: tensões, fluxos, padrões, interdependências
- Não aponta "problemas" — aponta o que **aparece** no sistema
- Termina com um possível caminho de exploração (não uma solução)
- Nota epistêmica ao final: "Isso é uma hipótese, não um diagnóstico. O sistema que você opera é único — essa leitura é um ponto de partida para explorar."

**Geração:** o padrão de respostas do grafo (nós ativados + intensidade por nó) é enviado ao Agente Labuta Org Designer via Claude API. O prompt do agente é definido separadamente e injetado como system prompt — **slot referenciado no código, conteúdo TBD**.

#### Bloco C — Tipologias de intervenção sugeridas
2–3 tipologias selecionadas com base no padrão do grafo (lógica de mapeamento fixa no MVP).

**As 9 tipologias disponíveis:**

| Categoria | Tipologia | Descrição |
|---|---|---|
| **Vetorial** | Movimentar | Altera custos de energia e tempo ao redor de um item (não o item em si) |
| **Vetorial** | Destruir | Elimina um item ou sua influência no sistema |
| **Vetorial** | Estabilizar | Mantém um actante onde já está — nem mais nem menos energia |
| **Sinalização** | Condicionar | Mapeia ligações entre itens — o que possibilita o quê |
| **Sinalização** | Monitorar | Observação focada em linhas de fronteira e mudanças importantes |
| **Sinalização** | Acionar | Condições presentes — agora podemos e devemos agir |
| **Comunicação** | Pesquisar | Investigar, dar sentido, ampliar opções antes de agir |
| **Comunicação** | Solicitar | Engajar colaboração ou permissão — "chamar a cavalaria" |
| **Comunicação** | Transparecer | Tornar visível o que opera no implícito para estimular interações |

**Estrutura de cada card de tipologia:**
1. **Nome + categoria** (badge colorido por categoria)
2. **Por que aparece no seu sistema** — parágrafo curto conectando a tipologia ao padrão identificado no grafo (gerado pelo agente)
3. **Efeitos esperados** — lista de 3–4 efeitos observáveis
4. **Feedback loop** — reforço positivo (↑), risco de amplificação (−), o que observar (↺)
5. **Variáveis que sinaliza/influencia** — tags com seta de direção (↑↓~)
6. **Possíveis experimentos concretos** — 2–3 experimentos específicos por tipologia (conteúdo fixo no MVP, definido para cada tipologia)

### Tela 5 — CTA leve

- Headline: "Isso ressou com algo que você está vivendo?"
- Subtexto breve sobre a abordagem da Labuta (experimentos estruturados, não consultoria tradicional)
- CTA primário: "Conversar com a Labuta →" (link para contato/calendly)
- CTA secundário: "Compartilhar leitura" (share link da página de resultado)

---

## Arquitetura técnica

### Stack
- **Frontend:** Next.js 14 + React 19 + TypeScript + Tailwind CSS
- **Backend:** Supabase (Postgres + RLS)
- **IA:** Claude API (modelo: claude-sonnet-4-6) — geração da leitura narrativa e seleção de tipologias
- **Email:** Resend (envio do resultado por email após captura)
- **Deploy:** Vercel

### Componentes principais

```
src/
├── app/
│   ├── page.tsx                    # Tela 1: Landing
│   ├── assessment/
│   │   ├── page.tsx                # Tela 2: Grafo Navegável
│   │   ├── gate/page.tsx           # Tela 3: Email Gate
│   │   └── result/[id]/page.tsx    # Tela 4+5: Resultado + CTA
│
├── components/
│   ├── grafo/
│   │   ├── GrafoCanvas.tsx         # SVG interativo do grafo
│   │   ├── GrafoNode.tsx           # Nó individual (estados visuais)
│   │   └── NarrativaPanel.tsx      # Painel lateral de micro-narrativa
│   ├── resultado/
│   │   ├── LeituraSistemica.tsx    # Bloco B — narrativa do agente
│   │   ├── TipologiaCard.tsx       # Card expandido de tipologia
│   │   └── GrafoResult.tsx         # Grafo com nós ativados
│   └── ui/
│       ├── EmailGate.tsx
│       └── CTABlock.tsx
│
└── lib/
    ├── assessment/
    │   ├── types.ts                # Tipos: Nó, Micro-narrativa, Resposta, Padrão
    │   ├── scoring.ts              # Calcula padrão de ativação dos nós
    │   ├── tipologias.ts           # Dados fixos das 9 tipologias + experimentos
    │   └── mapeamento.ts           # Regras: padrão de nós → tipologias sugeridas
    ├── ai/
    │   └── orgDesigner.ts          # Chamada Claude API com slot do system prompt
    └── supabase/
        ├── client.ts
        └── server.ts
```

### Schema Supabase

```sql
-- Respostas do assessment por lead
CREATE TABLE assessment_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  -- Lead
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  -- Padrão de respostas: { node_id: { narrative_id: "ressoa" | "nao_tanto" }[] }
  responses JSONB NOT NULL,
  -- Resultado gerado
  activated_nodes JSONB,     -- [{ node_id, intensity: 0-1 }]
  narrative_text TEXT,       -- leitura gerada pelo agente
  tipologias_ids TEXT[],     -- tipologias sugeridas (ex: ["transparecer", "condicionar"])
  -- Metadados
  result_shared BOOLEAN DEFAULT false,
  email_sent BOOLEAN DEFAULT false
);
```

### Lógica de mapeamento (MVP — regras fixas)

O mapeamento `padrão de nós ativados → tipologias sugeridas` é implementado como um conjunto de regras fixas em `mapeamento.ts`. Exemplo de lógica:

- Nó "Decisão" altamente ativado + Nó "Papéis" altamente ativado → sugerir **Transparecer** + **Condicionar**
- Nó "Aprendizado" ativado isoladamente → sugerir **Pesquisar** + **Monitorar**
- Múltiplos nós ativados com alta intensidade → sugerir **Estabilizar** (o que não tocar)

A lógica exata de mapeamento é definida separadamente, após a definição dos nós e micro-narrativas.

### Agente Labuta Org Designer

O agente é chamado via `lib/ai/orgDesigner.ts` após o email gate, recebendo:

```typescript
{
  activatedNodes: { nodeId: string; label: string; intensity: number }[];
  topConnections: { from: string; to: string }[];
  suggestedTipologias: string[];
}
```

O system prompt do agente é injetado via variável de ambiente (`LABUTA_ORG_DESIGNER_PROMPT`) — **conteúdo TBD, definido separadamente**. A voz do agente deve:
- Usar linguagem de org design (tensões, fluxos, interdependências, actantes)
- Deixar claro que é uma leitura possível, não a única
- Acolher a complexidade — nunca simplificar em excesso
- Não apontar "problemas", mas o que **aparece** no sistema
- Usar pensamento sistêmico: feedback loops, causalidade circular, emergência

---

## Conteúdo em aberto (TBD)

Os seguintes itens de conteúdo são definidos **fora do escopo de implementação técnica**:

1. **Nós do grafo** — quais são os pontos de alavancagem e seus rótulos (4–6 nós)
2. **Micro-narrativas** — 2–3 por nó, frases curtas descrevendo situações organizacionais reais
3. **Prompt do Agente Org Designer** — system prompt com voz, epistemologia e estilo da Labuta
4. **Regras de mapeamento** — padrão de nós → tipologias (requer conteúdo dos nós)
5. **Experimentos concretos por tipologia** — 2–3 por tipologia (textos fixos)

---

## O que está fora de escopo (MVP)

- Analytics avançada
- Múltiplas línguas
- Admin dashboard
- Gamification
- Histórico de resultados por lead
- Comparação entre assessments

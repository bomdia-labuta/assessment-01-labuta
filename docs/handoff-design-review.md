# Handoff — Revisão de Design · Assessment Labuta

**Para:** time de Design
**De:** Thiago / Labuta Labs
**Status do produto:** protótipo funcional (local), pronto para revisão de arquitetura de informação e fluxo.

---

## 1. Objetivo da revisão

O assessment já funciona ponta a ponta e a **metodologia/conteúdo está validada**. O que precisamos de vocês agora é a camada de **design e arquitetura de informação**:

- Repensar o **fluxo** (a sequência de telas e o que cada momento pede do usuário).
- Reestruturar a **arquitetura de informação** — principalmente na **result page**, onde há muita coisa: o que mantém, o que reorganiza, o que corta.
- Olhar com lupa o **gate** (tela de captura) — é o ponto de conversão; o equilíbrio entre "entregar valor" e "pedir o contato" é crítico.

Não é revisão de pixel/branding fino — é estrutura, hierarquia e clareza.

---

## 2. Como acessar o protótipo

**Galeria de revisão (online, sempre disponível):**

👉 **https://labuta-assessment-review.surge.sh**

São as telas reais do app capturadas e organizadas para revisão e anotação (incluindo o gate populado e os dois estados do gate). Acessível a qualquer momento, de qualquer lugar — não depende da máquina de ninguém.

> Para anotar: tirem print / abram no Figma e comentem por cima, ou usem o doc abaixo como referência por tela.

_(Opcional) Se em algum momento quiserem testar o **fluxo funcional de verdade** — gate enviando, leitura gerada ao vivo — o Thiago pode subir um link temporário com `./scripts/share-preview.sh`. Para a revisão de design, a galeria acima já cobre o necessário.)_

---

## 3. O fluxo, tela a tela

| # | Tela | Rota | Papel no fluxo |
|---|------|------|----------------|
| 1 | Landing | `/` | Explica o que é, para quem é, e convida a começar |
| 2 | Assessment (passos) | `/assessment` → `/assessment/[step]` | Usuário revisa micro-narrativas de tensões, tema a tema |
| 3 | **Gate** (captura) | `/assessment/gate` | Pede nome/email para liberar a leitura. Exige mín. 3 temas revisados |
| 4 | **Result** | `/assessment/result/[id]` | A leitura sistêmica estruturada + CTA |

---

## 4. Inventário de informação — o que rever em cada tela

Legenda: 🟢 manter · 🟡 repensar/reorganizar · 🔴 candidato a cortar · 🔒 travado (metodologia, não mexer)

### Tela 1 — Landing (`/`)
- Headline + subtexto (o que é / para quem) — 🟡
- Selo "gratuito · anônimo · ~10 min · não é teste de certo/errado" — 🟡 (posiciona expectativa)
- Botão "Começar o assessment" — 🟢

### Tela 2 — Assessment (passos)
- Grafo SVG dos temas (status por cor) — 🟢 (assinatura visual do produto)
- Micro-narrativas com resposta de ressonância (sim / um pouco / não) — 🔒 (é o motor do método)
- Possibilidade de adicionar narrativa própria — 🟡
- Navegação entre temas / progresso — 🟡 (como o usuário sabe onde está e quanto falta?)

### Tela 3 — Gate (captura) ⭐ foco
- Grafo desfocado ao fundo ("seu mapa está pronto") — 🟡 (gera desejo, mas avaliar)
- Copy "Para ver a leitura completa, deixa seu contato" — 🟡
- Campos nome + email + consentimento de marketing — 🟢 (email é o objetivo de negócio)
- Regra de mín. 3 temas: se faltar, mostra tela "Revisar mais temas" — 🟡 (momento de fricção: como tornar isso encorajador, não punitivo?)
- **Perguntas centrais:** o gate pede o contato no momento certo? Mostra valor suficiente ANTES de pedir? O que aparece depois do envio (espera de ~50s) está tratado?

### Tela 4 — Result page ⭐ foco (maior densidade)
A leitura agora é **estruturada em blocos** (não mais texto corrido). Em ordem:
- Grafo do resultado — 🟢
- **Nota de hipótese** (caixa âmbar: "isto é uma hipótese, não um diagnóstico") — 🔒 (postura da Labuta, vocabulário travado)
- **A leitura do sistema** — 4 cards: Eventos / Padrões / Estruturas / Modelos mentais — 🔒 conteúdo (modelo de 4 níveis), 🟡 forma (como apresentar?)
- **Artefatos estruturais impactados** — cards com "como impacta" + "tensão relacionada" — 🟡 (é a ponte cultura→estrutura; muita info, como hierarquizar?)
- **Loops de feedback** — card com variáveis (↑↓~) — 🟡 (conceito denso; vale para todo público?)
- **Tipologia de intervenção** (1 das 9) — card rico: efeitos esperados · feedback loop · variáveis que sinaliza · **por que essa** · experimentos (cada um "endereça: <artefato>") — 🟡 (é o clímax do valor; muita informação num card só)
- **CTA** "Quer explorar isso com a Labuta?" — 🟢 (conversão final)

> Pergunta-guia para a result page: um lead que não conhece a metodologia consegue **ler de cima a baixo e sair com 1 insight claro + vontade de conversar**? O que ajuda e o que atrapalha esse caminho?

---

## 5. Decisões travadas (🔒 — por favor não redesenhar para fora disso)

- **Vocabulário controlado:** nunca "diagnóstico", "causa raiz", "problema", "solução", "disfunção". Sempre "tensões", "padrões emergentes", "hipóteses de intervenção", "leitura sistêmica".
- **Sem score numérico** nos temas — é ressonância (sim/um pouco), não nota.
- **Mínimo 3 temas** revisados para gerar leitura com valor.
- **Modelo de 4 níveis** (Eventos→Padrões→Estruturas→Modelos) é circular, sem causa raiz.
- **1 tipologia recomendada** das 9; as outras 8 são gancho para a conversa com a Labuta.
- A leitura é gerada por IA no momento do envio (não é instantânea).

Tudo o mais — layout, hierarquia, ordem dos blocos, quanto mostrar de cada um, navegação, microcopy — está **aberto**.

---

## 6. O que esperamos de volta

- Onde o **fluxo de informação** pode ser reestruturado (ordem, agrupamento, progressão).
- Na **result page**: o que manter / reorganizar / cortar, e como hierarquizar a densidade.
- No **gate**: como maximizar conversão sem queimar a confiança (valor antes do pedido).
- Anotações direto sobre as telas (prints/Figma) são bem-vindas.

Formato livre — Figma, doc comentado, ou conversa. O que for mais rápido para vocês.

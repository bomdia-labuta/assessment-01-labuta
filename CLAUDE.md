# Assessment Leads Labuta — CLAUDE.md

**Plataforma de assessment comercial para leads e possíveis clientes da Labuta Labs.**

Objetivo: demonstrar a experiência Labuta **antes** de contratação, de forma gratuita.

---

## 📋 Visão Geral

- **Público:** Leads externos, possíveis clientes
- **Autenticação:** Nenhuma (público anônimo)
- **Objetivo Estratégico:** Converter leads em contatos qualificados capturando dados durante o assessment
- **Futura Integração:** Subdomínio independente (assessment.labuta.com), depois incorporado ao site Labuta
- **Referência Visual:** https://labuta-assessment.surge.sh/p2-grafo.html

---

## 🛠️ Stack

- **Frontend:** Next.js 14 + React 19 + TypeScript
- **Styling:** Tailwind CSS + Branding Labuta (cores: labuta-500 = #8b5cf6)
- **Backend:** Supabase (Postgres + RLS)
- **Deploy:** Vercel (subdomínio: assessment.labuta.com)
- **Email:** Resend (envio de resultado/follow-up)
- **Auth:** Nenhuma (público)

---

## 🏗️ Arquitetura

```
assessment-leads-labuta/
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Landing/instrução
│   │   ├── assessment/        # Rotas do assessment
│   │   │   ├── page.tsx       # Iniciar assessment
│   │   │   ├── [step]/        # Passo a passo (dinâmico)
│   │   │   └── result/        # Resultado final
│   │   └── globals.css
│   │
│   ├── components/
│   │   ├── layout/            # Header, footer, container
│   │   └── ui/                # Buttons, cards, forms, progress
│   │
│   └── lib/
│       ├── supabase/          # Client/Server Supabase
│       ├── assessment/        # Lógica de assessment (scoring, etc)
│       └── email/             # Templates Resend
│
├── supabase/
│   └── migrations/            # Schema (assessments, responses, leads)
│
└── docs/
    └── superpowers/
        └── specs/             # Design docs
```

---

## 🎯 Escopo Inicial (MVP)

**Em desenvolvimento:**
- [ ] UX/Fluxo do assessment (brainstorm)
- [ ] Schema Supabase (questões, respostas, leads)
- [ ] Componentes core (formulário, progresso, resultado)
- [ ] Captura de lead (nome, email)
- [ ] Integração Supabase
- [ ] Email de resultado (Resend)
- [ ] Testes E2E
- [ ] Deploy Vercel

**Fora de escopo (v2):**
- Analytics avançada
- Gamification
- Múltiplas línguas
- Admin dashboard

---

## 📊 Schema Supabase (Esboço)

```sql
-- Assessments (tipos de testes disponíveis)
CREATE TABLE assessments (
  id UUID PRIMARY KEY,
  name TEXT,
  description TEXT,
  created_at TIMESTAMP
);

-- Questions (perguntas do assessment)
CREATE TABLE questions (
  id UUID PRIMARY KEY,
  assessment_id UUID REFERENCES assessments,
  order INT,
  question_text TEXT,
  question_type TEXT, -- 'multiple_choice', 'scale', etc
  created_at TIMESTAMP
);

-- Answers (opções de resposta)
CREATE TABLE answers (
  id UUID PRIMARY KEY,
  question_id UUID REFERENCES questions,
  answer_text TEXT,
  score_value INT,
  created_at TIMESTAMP
);

-- Responses (respostas do usuário)
CREATE TABLE responses (
  id UUID PRIMARY KEY,
  assessment_id UUID REFERENCES assessments,
  email TEXT,
  name TEXT,
  selected_answers JSONB, -- { question_id: answer_id }
  total_score INT,
  created_at TIMESTAMP
);
```

---

## 🚀 Próximos Passos

1. **Brainstorm UX** (agora)
   - Tipo de teste? (grafo, linear, quiz?)
   - Quantas questões?
   - Qual é a estrutura?
   - Como apresentar resultado?

2. **Design Spec** (após brainstorm)
   - Documento detalhado de UX/Fluxo
   - Wireframes/descrições

3. **Schema & Componentes** (após spec aprovada)
   - Criar migrations Supabase
   - Implementar componentes core

4. **Integração & Deploy** (final)
   - Conectar Supabase
   - Testes
   - Deploy Vercel

---

## 📝 Princípios

- **Simplicidade:** MVP focado — captura de lead + resultado, nada mais
- **Reversibilidade:** Fácil de iterar, mockups antes de código
- **Branding Labuta:** Identidade visual clara desde dia 1
- **Performance:** Sem JS desnecessário (server components quando possível)
- **Conversão:** Cada passo do assessment deve levar a uma ação (capturar email, enviar resultado)

---

## 🔗 Referências

- **Prototipo referência:** https://labuta-assessment.surge.sh/p2-grafo.html
- **Hub Labuta:** `/Users/thiagodalmoro/Documents/Antigravity/hub-labuta`
- **GitHub:** https://github.com/bomdia-labuta/assessment-01-labuta
- **Deploy:** (será assessment.labuta.com após prototipagem)

---

**Status:** 🟡 Brainstorming UX em andamento  
**Criado:** 2026-06-09  
**Owner:** Thiago Dalmoro (Labuta Labs)

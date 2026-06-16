import { z } from 'zod/v4'

// Contrato da saída estruturada do relatório sistêmico.
// Garante o padrão de saída (validado via structured outputs da Anthropic + client-side).
// Os ids de artefato/tipologia espelham ARTEFATOS_ESTRUTURAIS e TIPOLOGIAS_INTERVENCAO em report-prompt.ts.

export const ARTEFATO_IDS = [
  'normas', 'papeis', 'fluxos', 'poder', 'rituais', 'incentivos',
  'processos', 'ferramentas', 'recursos', 'interacoes', 'ocorrencias', 'ambientes',
] as const

export const TIPOLOGIA_IDS = [
  'movimentar', 'destruir', 'estabilizar',
  'condicionar', 'monitorar', 'acionar',
  'pesquisar', 'solicitar', 'transparecer',
] as const

const artefatoIdEnum = z.enum(ARTEFATO_IDS)
const tipologiaIdEnum = z.enum(TIPOLOGIA_IDS)
const direcaoEnum = z.enum(['up', 'down', 'neutral'])

export const reportSchema = z.object({
  // BLOCO 1 — leitura do sistema (modelo de 4 níveis, circular, sem causa raiz)
  leituraSistema: z.object({
    eventos: z.string(),
    padroes: z.string(),
    estruturas: z.string(),
    modelos: z.string(),
  }),

  // BLOCO 2A — artefatos estruturais impactados (liga a cultura observada à estrutura)
  artefatosImpactados: z.array(z.object({
    artefatoId: artefatoIdEnum,
    comoImpacta: z.string(),
    tensaoRelacionada: z.string(),
  })),

  // BLOCO 2B — loop(s) de feedback (1 a 2)
  loops: z.array(z.object({
    titulo: z.string(),
    descricao: z.string(),
    variaveis: z.array(z.object({
      nome: z.string(),
      direcao: direcaoEnum,
    })),
  })),

  // BLOCO 3 — tipologia de intervenção (exatamente 1) + experimentos endereçando artefatos
  tipologia: z.object({
    tipologiaId: tipologiaIdEnum,
    porque: z.string(),
    experimentos: z.array(z.object({
      titulo: z.string(),
      descricao: z.string(),
      artefatoId: artefatoIdEnum,
    })),
  }),
})

export type RelatorioEstruturado = z.infer<typeof reportSchema>

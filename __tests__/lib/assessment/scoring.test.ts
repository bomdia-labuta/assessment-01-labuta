// __tests__/lib/assessment/scoring.test.ts
import { calculateNodeScore, calculateNodeScores, getTopNodes } from '@/lib/assessment/scoring'
import type { SessionState } from '@/lib/assessment/types'

describe('calculateNodeScore', () => {
  it('retorna 1.0 para sim sem tags', () => {
    expect(calculateNodeScore('sim', [])).toBe(1.0)
  })

  it('retorna 0.5 para um_pouco sem tags', () => {
    expect(calculateNodeScore('um_pouco', [])).toBe(0.5)
  })

  it('retorna 0.0 para nao sem tags', () => {
    expect(calculateNodeScore('nao', [])).toBe(0.0)
  })

  it('retorna 0.0 para null', () => {
    expect(calculateNodeScore(null, [])).toBe(0.0)
  })

  it('adiciona boost por tags e mantém max 1.0', () => {
    const score = calculateNodeScore('sim', ['tag1', 'tag2'])
    expect(score).toBe(1.0) // capped
  })

  it('aplica boost em score parcial', () => {
    const score = calculateNodeScore('nao', ['tag1'])
    expect(score).toBeGreaterThan(0.0)
    expect(score).toBeLessThanOrEqual(1.0)
  })
})

describe('getTopNodes', () => {
  const scores = {
    'comunicacao': 0.8,
    'tomada-de-decisao': 1.0,
    'trabalho-invisivel': 0.5,
    'ritos-e-reunioes': 0.2,
  } as Parameters<typeof getTopNodes>[0]

  it('retorna os top 3 por score decrescente', () => {
    const top = getTopNodes(scores, 3)
    expect(top[0]).toBe('tomada-de-decisao')
    expect(top[1]).toBe('comunicacao')
    expect(top[2]).toBe('trabalho-invisivel')
  })

  it('respeita o parâmetro n', () => {
    expect(getTopNodes(scores, 2)).toHaveLength(2)
  })
})

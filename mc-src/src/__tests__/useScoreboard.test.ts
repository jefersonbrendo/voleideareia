import { describe, it, expect } from 'vitest'
import {
  isSetOver,
  shouldChangeSide,
  setAlvo,
  sideChangeThreshold,
} from '../hooks/useScoreboard'
import type { ConfigPartida } from '../types'

const cfg = (pts: 21 | 15 | 11, fmt: 'bo1' | 'bo3' = 'bo1'): ConfigPartida => ({
  pontosPorSet: pts,
  formato: fmt,
  nomeDuplaA: 'A',
  nomeDuplaB: 'B',
})

describe('isSetOver', () => {
  it('não encerra antes do alvo', () => {
    expect(isSetOver(20, 18, 21)).toBe(false)
  })
  it('encerra quando alvo atingido com 2 de vantagem', () => {
    expect(isSetOver(21, 19, 21)).toBe(true)
    expect(isSetOver(19, 21, 21)).toBe(true)
  })
  it('não encerra com empate no alvo', () => {
    expect(isSetOver(21, 21, 21)).toBe(false)
  })
  it('não encerra com diferença de 1 acima do alvo', () => {
    expect(isSetOver(22, 21, 21)).toBe(false)
  })
  it('encerra com diferença de 2 acima do alvo (deuce)', () => {
    expect(isSetOver(23, 21, 21)).toBe(true)
  })
  it('set de 11: encerra em 11-9', () => {
    expect(isSetOver(11, 9, 11)).toBe(true)
  })
  it('set de 11: não encerra em 11-10 (deuce)', () => {
    expect(isSetOver(11, 10, 11)).toBe(false)
  })
  it('set de 15: encerra em 15-13', () => {
    expect(isSetOver(15, 13, 15)).toBe(true)
  })
})

describe('shouldChangeSide', () => {
  it('dispara na 7.ª bola total em set de 21', () => {
    expect(shouldChangeSide(3, 3, 4, 3, 21)).toBe(true)
  })
  it('não dispara se ainda não cruzou threshold (21)', () => {
    expect(shouldChangeSide(2, 3, 3, 3, 21)).toBe(false)
  })
  it('dispara na 14.ª bola (segundo cruzamento, set 21)', () => {
    expect(shouldChangeSide(7, 6, 8, 6, 21)).toBe(true)
  })
  it('dispara na 5.ª bola em set de 15', () => {
    expect(shouldChangeSide(2, 2, 3, 2, 15)).toBe(true)
  })
  it('não dispara em set de 15 antes do threshold', () => {
    expect(shouldChangeSide(1, 2, 2, 2, 15)).toBe(false)
  })
  it('dispara na 4.ª bola em set de 11', () => {
    expect(shouldChangeSide(1, 2, 2, 2, 11)).toBe(true)
  })
})

describe('sideChangeThreshold', () => {
  it('21 → 7', () => expect(sideChangeThreshold(21)).toBe(7))
  it('15 → 5', () => expect(sideChangeThreshold(15)).toBe(5))
  it('11 → 4', () => expect(sideChangeThreshold(11)).toBe(4))
})

describe('setAlvo', () => {
  it('retorna pontosPorSet para set 1 em bo1', () => {
    expect(setAlvo(cfg(21, 'bo1'), 1)).toBe(21)
  })
  it('retorna pontosPorSet para sets 1 e 2 em bo3', () => {
    expect(setAlvo(cfg(21, 'bo3'), 1)).toBe(21)
    expect(setAlvo(cfg(21, 'bo3'), 2)).toBe(21)
  })
  it('retorna 15 para o 3.º set em bo3 (tie-break)', () => {
    expect(setAlvo(cfg(21, 'bo3'), 3)).toBe(15)
    expect(setAlvo(cfg(15, 'bo3'), 3)).toBe(15)
    expect(setAlvo(cfg(11, 'bo3'), 3)).toBe(15)
  })
})

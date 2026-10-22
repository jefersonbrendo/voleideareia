import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { ANIMACOES } from '../src/data/animacoes'
import { compilar, estadoEm, resolverRef } from '../src/lib/animacao/linhaDoTempo'
import type { Animacao, Cena } from '../src/lib/animacao/tipos'

const RAIZ = join(__dirname, '..')
const lerCena = (n: number): Cena => JSON.parse(readFileSync(join(RAIZ, 'public', 'gem', 'diagramas', `${String(n).padStart(3, '0')}.json`), 'utf8'))

function exerciciosDoApp(): Array<{ numero: number; nome: string; passoAPasso: string[] }> {
  const html = readFileSync(join(RAIZ, 'index.html'), 'utf8')
  const m = /^const EX = (\[.*\]);\s*$/m.exec(html)
  if (!m) throw new Error('lista de exercícios não encontrada no index.html')
  return JSON.parse(m[1])
}

// Cena pequena e controlada para testar a matemática
const cenaDeTeste: Cena = {
  w: 200, h: 100,
  el: [
    { k: 'jogador', id: 'A1', x: 10, y: 50, r: 6, f: '#0284c7', s: '#fff', w: 1, t: 'A1' },
    { k: 'jogador', id: 'B1', x: 190, y: 50, r: 6, f: '#0f766e', s: '#fff', w: 1, t: 'B1' },
    { k: 'cone', id: 'cone1', x: 100, y: 20 },
    { k: 'zona', id: 'zona1', x: 150, y: 80 },
    { k: 'seta', id: 'seta1', d: 'M10 50L190 50', s: '#dc2626', w: 1, a: [10, 50], b: [190, 50] },
  ],
}

describe('resolução de posições', () => {
  it('ids de jogador, cone e zona; pontas de seta; ponto fixo; com deslocamento', () => {
    expect(resolverRef(cenaDeTeste, 'A1')).toEqual([10, 50])
    expect(resolverRef(cenaDeTeste, 'cone1')).toEqual([100, 20])
    expect(resolverRef(cenaDeTeste, 'zona1')).toEqual([150, 80])
    expect(resolverRef(cenaDeTeste, 'seta1.a')).toEqual([10, 50])
    expect(resolverRef(cenaDeTeste, 'seta1.b')).toEqual([190, 50])
    expect(resolverRef(cenaDeTeste, [3, 4])).toEqual([3, 4])
    expect(resolverRef(cenaDeTeste, { ref: 'A1', dx: 5, dy: -2 })).toEqual([15, 48])
  })

  it('id inexistente é erro claro', () => {
    expect(() => resolverRef(cenaDeTeste, 'Z9')).toThrow(/não existe/)
    expect(() => resolverRef(cenaDeTeste, 'seta1')).toThrow(/seta1.a|seta1.b/)
  })
})

describe('linha do tempo', () => {
  const anim: Animacao = {
    pausaEntrePassos: 0.5,
    pausaFinal: 2,
    bolaInicial: 'A1',
    passos: [
      { texto: 1, acoes: [{ tipo: 'pausa', dur: 1 }] },
      { texto: 2, acoes: [{ tipo: 'jogador', id: 'A1', para: [110, 50], dur: 2 }, { tipo: 'seta', id: 'seta1', dur: 2 }] },
      { texto: 3, acoes: [{ tipo: 'bola', para: 'B1', alta: true, dur: 2 }] },
    ],
  }
  const c = compilar(anim, cenaDeTeste)

  it('os passos acontecem um depois do outro, com pausa entre eles', () => {
    expect(c.passos).toEqual([
      { texto: 1, inicio: 0, fim: 1 },
      { texto: 2, inicio: 1.5, fim: 3.5 },
      { texto: 3, inicio: 4, fim: 6 },
    ])
    expect(c.duracao).toBe(6 + 2) // fim do último passo + pausa final
  })

  it('o passo em andamento acompanha o tempo (destaque no texto)', () => {
    expect(estadoEm(c, 0).passo).toBe(1)
    expect(estadoEm(c, 1.2).passo).toBe(1)
    expect(estadoEm(c, 1.5).passo).toBe(2)
    expect(estadoEm(c, 5).passo).toBe(3)
    expect(estadoEm(c, 7.9).passo).toBe(3)
  })

  it('jogador se desloca de forma contínua: começa parado, passa pelo meio, termina no destino', () => {
    expect(estadoEm(c, 1).jogadores.get('A1')).toEqual([10, 50])
    const meio = estadoEm(c, 2.5).jogadores.get('A1')!
    expect(meio[0]).toBeCloseTo(60, 5)
    expect(estadoEm(c, 3.5).jogadores.get('A1')).toEqual([110, 50])
    expect(estadoEm(c, 8).jogadores.get('A1')).toEqual([110, 50])
    expect(estadoEm(c, 8).jogadores.get('B1')).toEqual([190, 50])
  })

  it('seta se desenha de 0 a 1 no intervalo certo', () => {
    expect(estadoEm(c, 1.4).setas.get('seta1')).toBe(0)
    expect(estadoEm(c, 2.5).setas.get('seta1')).toBeCloseTo(0.5, 5)
    expect(estadoEm(c, 3.6).setas.get('seta1')).toBe(1)
  })

  it('bola alta faz arco: sobe no meio do caminho e volta ao chão no destino', () => {
    const noInicio = estadoEm(c, 0).bola
    expect(noInicio).toMatchObject({ visivel: true, x: 10, y: 50, altura: 0 })
    const meio = estadoEm(c, 5).bola
    expect(meio.altura).toBeCloseTo(1, 5)
    expect(meio.x).toBeCloseTo(100, 5)
    const fim = estadoEm(c, 6.5).bola
    expect(fim).toMatchObject({ x: 190, y: 50, altura: 0 })
  })

  it('bola baixa (cortada, saque rasante) quase não sobe', () => {
    const baixa = compilar({ bolaInicial: 'A1', passos: [{ texto: 1, acoes: [{ tipo: 'bola', para: 'B1', dur: 1 }] }] }, cenaDeTeste)
    expect(estadoEm(baixa, 0.5).bola.altura).toBeLessThan(0.3)
  })

  it('sem bolaInicial a bola só aparece no primeiro voo', () => {
    const c2 = compilar({ passos: [{ texto: 1, seq: true, acoes: [{ tipo: 'pausa', dur: 1 }, { tipo: 'bola', de: 'A1', para: 'B1', dur: 1 }] }] }, cenaDeTeste)
    expect(estadoEm(c2, 0).bola.visivel).toBe(false)
    expect(estadoEm(c2, 1.5).bola.visivel).toBe(true)
  })

  it('"junto": o passo começa durante o anterior (coisas simultâneas)', () => {
    const c3 = compilar({
      pausaEntrePassos: 0.5,
      passos: [
        { texto: 1, acoes: [{ tipo: 'pausa', dur: 3 }] },
        { texto: 2, junto: 1, acoes: [{ tipo: 'pausa', dur: 1 }] },
        { texto: 3, acoes: [{ tipo: 'pausa', dur: 1 }] },
      ],
    }, cenaDeTeste)
    expect(c3.passos.map((p) => [p.inicio, p.fim])).toEqual([[0, 3], [1, 2], [3.5, 4.5]])
  })

  it('"seq" roda as ações uma depois da outra; "atraso" empurra uma ação', () => {
    const c4 = compilar({
      passos: [{ texto: 1, seq: true, acoes: [{ tipo: 'jogador', id: 'A1', para: [50, 50], dur: 1 }, { tipo: 'jogador', id: 'A1', para: [10, 50], dur: 1 }] }],
    }, cenaDeTeste)
    expect(c4.movimentos.get('A1')!.map((m) => [m.inicio, m.fim])).toEqual([[0, 1], [1, 2]])
    const c5 = compilar({ passos: [{ texto: 1, acoes: [{ tipo: 'seta', id: 'seta1', dur: 1, atraso: 2 }] }] }, cenaDeTeste)
    expect(c5.desenhos.get('seta1')).toEqual({ inicio: 2, fim: 3 })
  })

  it('erros claros para dados errados', () => {
    expect(() => compilar({ passos: [{ texto: 1, acoes: [{ tipo: 'jogador', id: 'X9', para: [1, 1] }] }] }, cenaDeTeste)).toThrow(/X9/)
    expect(() => compilar({ passos: [{ texto: 1, acoes: [{ tipo: 'seta', id: 'seta7' }] }] }, cenaDeTeste)).toThrow(/seta7/)
    expect(() => compilar({ passos: [{ texto: 1, acoes: [{ tipo: 'bola', para: 'B1' }] }] }, cenaDeTeste)).toThrow(/origem/)
  })
})

describe('linhas do tempo cadastradas (src/data/animacoes.ts)', () => {
  const exercicios = exerciciosDoApp()

  it('existem pelo menos os 5 exercícios do teste', () => {
    expect(Object.keys(ANIMACOES).length).toBeGreaterThanOrEqual(5)
  })

  for (const [numeroTexto, animacao] of Object.entries(ANIMACOES)) {
    const numero = Number(numeroTexto)
    describe(`exercício ${numero}`, () => {
      const ex = exercicios.find((e) => e.numero === numero)

      it('existe no app e tem cena', () => {
        expect(ex, 'exercício não encontrado').toBeDefined()
        expect(() => lerCena(numero)).not.toThrow()
      })

      it('compila contra a cena real (ids, setas e posições existem)', () => {
        const c = compilar(animacao, lerCena(numero))
        expect(c.duracao).toBeGreaterThan(3)
        expect(c.duracao).toBeLessThan(40)
      })

      it('cada passo aponta para um item real do "Passo a passo" e todos os itens são cobertos', () => {
        const total = ex!.passoAPasso.length
        const usados = new Set(animacao.passos.map((p) => p.texto))
        for (const p of animacao.passos) expect(p.texto, 'número de passo inexistente').toBeGreaterThanOrEqual(1)
        for (const p of animacao.passos) expect(p.texto).toBeLessThanOrEqual(total)
        for (let i = 1; i <= total; i++) expect(usados.has(i), `item ${i} do passo a passo sem animação`).toBe(true)
      })

      it('os passos aparecem na ordem do texto', () => {
        const ordem = animacao.passos.map((p) => p.texto)
        expect(ordem).toEqual([...ordem].sort((a, b) => a - b))
      })
    })
  }
})

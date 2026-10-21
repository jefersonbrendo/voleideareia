// @vitest-environment jsdom
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { IconesMaterial } from '../src/components/treinoCasa/IconesMaterial'
import { ChipVolume } from '../src/components/treinoCasa/ChipVolume'
import { SilhuetaRegioes } from '../src/components/treinoCasa/SilhuetaRegioes'
import {
  MATERIAIS_CASA,
  REGIOES_CASA,
  TREINO_CASA,
  type ExercicioCasa,
  type MaterialCasa,
  type RegiaoCasa,
} from '../src/data/treinoCasa'
import { ehSoCorpo, formatarVolume, materialEmTexto, precisaVistaDeCostas } from '../src/lib/treinoCasaTextos'

const MATERIAIS_PEDIDOS = ['corpo', 'bola', 'parede', 'cadeira', 'toalha', 'garrafa', 'elastico']
const REGIOES_PEDIDAS = ['pernas', 'gluteos', 'core', 'bracos', 'ombros', 'costas', 'corpo_inteiro']

describe('tipos fechados (o TypeScript recusa valores que não existem)', () => {
  it('os valores aceitos são exatamente os combinados', () => {
    expect([...MATERIAIS_CASA]).toEqual(MATERIAIS_PEDIDOS)
    expect([...REGIOES_CASA]).toEqual(REGIOES_PEDIDAS)
  })

  it('valor inexistente é erro de compilação', () => {
    // @ts-expect-error 'halter' não é um material válido
    const material: MaterialCasa = 'halter'
    // @ts-expect-error 'peito' não é uma região válida
    const regiao: RegiaoCasa = 'peito'
    // @ts-expect-error lista de material não pode ficar vazia
    const semMaterial: ExercicioCasa['material'] = []
    // @ts-expect-error lista de regiões não pode ficar vazia
    const semRegiao: ExercicioCasa['regioes'] = []
    // @ts-expect-error 'minutos' não existe em volume
    const volume: ExercicioCasa['volume'] = { minutos: 5 }
    expect([material, regiao, semMaterial, semRegiao, volume]).toBeTruthy()
  })
})

describe('dados dos 112 exercícios', () => {
  it('todos têm material, volume e regiões válidos', () => {
    for (const e of TREINO_CASA) {
      expect(e.material.length, e.nome).toBeGreaterThan(0)
      for (const m of e.material) expect(MATERIAIS_CASA, e.nome).toContain(m)
      expect(e.regioes.length, e.nome).toBeGreaterThan(0)
      for (const r of e.regioes) expect(REGIOES_CASA, e.nome).toContain(r)
      expect(formatarVolume(e.volume), `${e.nome}: volume vazio`).not.toBe('')
    }
  })

  it('"corpo" só aparece sozinho; sem materiais repetidos', () => {
    for (const e of TREINO_CASA) {
      if (e.material.includes('corpo')) expect(e.material, e.nome).toEqual(['corpo'])
      expect(new Set(e.material).size, e.nome).toBe(e.material.length)
    }
  })

  it('volume: números positivos e tempo no formato 30s, 20–30s ou 5 min', () => {
    for (const e of TREINO_CASA) {
      const { series, repeticoes, tempo } = e.volume
      if (series !== undefined) expect(Number.isInteger(series) && series > 0, e.nome).toBe(true)
      if (repeticoes !== undefined) expect(Number.isInteger(repeticoes) && repeticoes > 0, e.nome).toBe(true)
      if (tempo !== undefined) expect(tempo, e.nome).toMatch(/^\d+(–\d+)?(s| min)$/)
    }
  })

  it('"corpo_inteiro" vem sozinho', () => {
    for (const e of TREINO_CASA) if (e.regioes.includes('corpo_inteiro')) expect(e.regioes, e.nome).toEqual(['corpo_inteiro'])
  })

  it('há exercícios só com o corpo para quem não tem nada em casa', () => {
    expect(TREINO_CASA.filter((e) => ehSoCorpo(e.material)).length).toBeGreaterThanOrEqual(30)
  })

  it('o arquivo documenta como preencher material, volume e regiões', () => {
    const fonte = readFileSync(join(__dirname, '..', 'src', 'data', 'treinoCasa.ts'), 'utf8')
    for (const palavra of ['COMO PREENCHER CADA CAMPO', 'material ......', 'volume ........', 'regioes .......', "{ series: 3, repeticoes: 12 }"]) {
      expect(fonte).toContain(palavra)
    }
  })
})

describe('formatação do volume', () => {
  it('3 × 12, 3 × 30s e 5 min (os exemplos pedidos)', () => {
    expect(formatarVolume({ series: 3, repeticoes: 12 })).toBe('3 × 12')
    expect(formatarVolume({ series: 3, tempo: '30s' })).toBe('3 × 30s')
    expect(formatarVolume({ tempo: '5 min' })).toBe('5 min')
  })

  it('combinações incompletas', () => {
    expect(formatarVolume({ repeticoes: 6 })).toBe('6 rep.')
    expect(formatarVolume({ series: 4 })).toBe('4 séries')
    expect(formatarVolume({ series: 1 })).toBe('1 série')
    expect(formatarVolume({})).toBe('')
  })

  it('o chip mostra o texto formatado', () => {
    expect(ChipVolume({ series: 3, repeticoes: 12 }).textContent).toBe('3 × 12')
    expect(ChipVolume({ tempo: '5 min' }).classList.contains('cda-chip-volume')).toBe(true)
  })
})

describe('IconesMaterial', () => {
  it('um ícone por material, com o nome curto embaixo', () => {
    const el = IconesMaterial(['corpo', 'bola', 'parede', 'cadeira', 'toalha', 'garrafa', 'elastico'])
    const itens = [...el.querySelectorAll('.cda-mat')]
    expect(itens.map((i) => i.getAttribute('data-material'))).toEqual(MATERIAIS_PEDIDOS)
    expect(itens.map((i) => i.querySelector('.cda-mat-nome')?.textContent)).toEqual(['Só o corpo', 'Bola', 'Parede', 'Cadeira', 'Toalha', 'Garrafa', 'Elástico'])
    for (const i of itens) expect(i.querySelector('svg path, svg rect, svg circle'), i.getAttribute('data-material') ?? '').not.toBeNull()
  })

  it('sem nome: só os ícones (card da lista)', () => {
    const el = IconesMaterial(['bola', 'parede'], { comNome: false })
    expect(el.querySelectorAll('.cda-mat-ico')).toHaveLength(2)
    expect(el.querySelector('.cda-mat-nome')).toBeNull()
    expect(el.classList.contains('cda-materiais-so-icone')).toBe(true)
  })
})

describe('SilhuetaRegioes', () => {
  const ativas = (el: HTMLElement, vista?: string) =>
    [...el.querySelectorAll(`.sil-ativa${vista ? `[data-vista="${vista}"]` : ''}`)].map((g) => g.getAttribute('data-regiao'))
  const inativas = (el: HTMLElement, vista = 'frente') =>
    [...el.querySelectorAll(`.sil-inativa[data-vista="${vista}"]`)].map((g) => g.getAttribute('data-regiao'))

  it('só frente quando não há costas nem glúteos', () => {
    const el = SilhuetaRegioes(['pernas', 'core'])
    expect(el.getAttribute('data-vistas')).toBe('1')
    expect(el.querySelectorAll('[data-vista="costas"]')).toHaveLength(0)
    expect(ativas(el).sort()).toEqual(['core', 'pernas'])
    expect(inativas(el).sort()).toEqual(['bracos', 'ombros'])
  })

  it('frente e costas lado a lado quando há costas ou glúteos', () => {
    for (const regioes of [['costas', 'bracos'], ['gluteos'], ['pernas', 'gluteos']] as RegiaoCasa[][]) {
      const el = SilhuetaRegioes(regioes)
      expect(el.getAttribute('data-vistas'), regioes.join()).toBe('2')
      expect(el.querySelectorAll('[data-vista="frente"]').length).toBeGreaterThan(0)
      expect(el.querySelectorAll('[data-vista="costas"]').length).toBeGreaterThan(0)
    }
    expect(precisaVistaDeCostas(['pernas'])).toBe(false)
    expect(precisaVistaDeCostas(['costas'])).toBe(true)
  })

  it('costas e glúteos são destacados na vista de costas', () => {
    const el = SilhuetaRegioes(['costas', 'gluteos'])
    expect(ativas(el, 'costas').sort()).toEqual(['costas', 'gluteos'])
    expect(inativas(el, 'costas').sort()).toEqual(['bracos', 'core', 'ombros', 'pernas'])
  })

  it('corpo_inteiro destaca tudo (só frente)', () => {
    const el = SilhuetaRegioes(['corpo_inteiro'])
    expect(el.getAttribute('data-vistas')).toBe('1')
    expect(el.querySelectorAll('.sil-inativa')).toHaveLength(0)
    expect(ativas(el).sort()).toEqual(['bracos', 'core', 'ombros', 'pernas'])
  })

  it('altura configurável (card 32, detalhe 120) e texto alternativo', () => {
    expect(SilhuetaRegioes(['pernas'], { altura: 32 }).querySelector('svg')?.getAttribute('height')).toBe('32')
    expect(SilhuetaRegioes(['pernas'], { altura: 120 }).querySelector('svg')?.getAttribute('height')).toBe('120')
    expect(SilhuetaRegioes(['pernas', 'gluteos']).getAttribute('aria-label')).toBe('Regiões trabalhadas: pernas e glúteos')
  })

  it('usa só variáveis de cor do tema (nada de cor fixa no SVG)', () => {
    const svg = SilhuetaRegioes(['costas', 'pernas']).innerHTML
    expect(svg).not.toMatch(/fill="#|stroke="#|style=/i)
  })
})

describe('texto de compartilhar com material e volume', () => {
  it('exemplo pedido: "Material: bola e parede | 3 × 12"', () => {
    expect(`Material: ${materialEmTexto(['bola', 'parede'])} | ${formatarVolume({ series: 3, repeticoes: 12 })}`).toBe('Material: bola e parede | 3 × 12')
    expect(materialEmTexto(['corpo'])).toBe('só o corpo')
    expect(materialEmTexto(['bola', 'parede', 'cadeira'])).toBe('bola, parede e cadeira')
  })
})

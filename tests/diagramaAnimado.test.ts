// @vitest-environment jsdom
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CLASSE_PASSO_ATIVO, VELOCIDADE_LENTA, criarDiagramaAnimado, type Relogio } from '../src/components/diagramaAnimado/DiagramaAnimado'
import { ANIMACOES } from '../src/data/animacoes'
import { compilar } from '../src/lib/animacao/linhaDoTempo'
import type { Cena } from '../src/lib/animacao/tipos'
import { animarDiagramaDoExercicio, pararAnimacao } from '../src/ui/animacaoNaTela'

const cena = (n: number): Cena => JSON.parse(readFileSync(join(__dirname, '..', 'public', 'gem', 'diagramas', `${String(n).padStart(3, '0')}.json`), 'utf8'))

function relogioFalso() {
  const r = { tocar: vi.fn(), pausar: vi.fn(), reiniciar: vi.fn(), parar: vi.fn(), velocidade: 1, tempo: 0 } satisfies Relogio
  let tick: (t: number) => void = () => {}
  const fabrica = (_: number, aoAtualizar: (t: number) => void) => { tick = aoAtualizar; return r }
  return { r, fabrica, tick: (t: number) => tick(t) }
}

function paginaDeExercicio(passos: number): HTMLElement {
  const main = document.createElement('div')
  main.innerHTML = `<div class="page ex-page">
    <div class="ex-hero"><figure class="diag-hero"><img src="/gem/diagrams/146.png" alt="d"><figcaption>Montagem</figcaption></figure></div>
    <div id="conteudo"><ul class="step-list">${Array.from({ length: passos }, (_, i) => `<li class="step-item"><span class="step-num">${i + 1}</span><span class="step-text">passo ${i + 1}</span></li>`).join('')}</ul></div>
  </div>`
  document.body.replaceChildren(main)
  return main
}

beforeEach(() => { document.body.replaceChildren() })
afterEach(() => { pararAnimacao(); vi.restoreAllMocks() })

describe('DiagramaAnimado: controles e destaque do passo', () => {
  const montar = (relogio = relogioFalso()) => {
    const main = paginaDeExercicio(5)
    const figura = main.querySelector('.diag-hero')!
    const d = criarDiagramaAnimado({ numero: 146, cena: cena(146), animacao: ANIMACOES[146], totalPassos: 5, fabricaRelogio: relogio.fabrica })
    figura.querySelector('img')!.replaceWith(d.el)
    return { main, d, ...relogio }
  }

  it('monta o SVG da quadra com jogadores, zonas e os 3 botões', () => {
    const { d } = montar()
    expect(d.el.querySelector('svg')).not.toBeNull()
    expect(d.el.querySelectorAll('[data-jogador]')).toHaveLength(2)
    expect([...d.el.querySelectorAll('.cda-anim-btn')].map((b) => b.getAttribute('data-acao'))).toEqual(['tocar', 'velocidade', 'repetir'])
  })

  it('começa tocando sozinha (sem IntersectionObserver, como num navegador antigo)', () => {
    const { r } = montar()
    expect(r.tocar).toHaveBeenCalled()
  })

  it('play/pausa: o botão alterna o rótulo e pausa/retoma o relógio', () => {
    const { d, r } = montar()
    const botao = d.el.querySelector('[data-acao="tocar"]') as HTMLButtonElement
    expect(botao.getAttribute('aria-label')).toBe('Pausar animação')
    botao.click()
    expect(r.pausar).toHaveBeenCalled()
    expect(botao.getAttribute('aria-label')).toBe('Reproduzir animação')
    expect(botao.getAttribute('data-estado')).toBe('pausado')
    r.tocar.mockClear()
    botao.click()
    expect(r.tocar).toHaveBeenCalled()
    expect(botao.getAttribute('aria-label')).toBe('Pausar animação')
  })

  it('velocidade: alterna entre normal (1×) e lenta (0,5×)', () => {
    const { d, r } = montar()
    const botao = d.el.querySelector('[data-acao="velocidade"]') as HTMLButtonElement
    expect(botao.textContent).toBe('1×')
    botao.click()
    expect(r.velocidade).toBe(VELOCIDADE_LENTA)
    expect(botao.textContent).toBe('0,5×')
    expect(botao.getAttribute('aria-pressed')).toBe('true')
    botao.click()
    expect(r.velocidade).toBe(1)
    expect(botao.textContent).toBe('1×')
  })

  it('repetir do começo: zera o relógio e volta a tocar, mesmo se estava pausada', () => {
    const { d, r } = montar()
    ;(d.el.querySelector('[data-acao="tocar"]') as HTMLElement).click()
    r.tocar.mockClear()
    ;(d.el.querySelector('[data-acao="repetir"]') as HTMLElement).click()
    expect(r.reiniciar).toHaveBeenCalled()
    expect(r.tocar).toHaveBeenCalled()
  })

  it('destaca no texto o item do passo a passo que está acontecendo, e mostra "Passo N de 5"', () => {
    const { main, d, tick } = montar()
    const c = compilar(ANIMACOES[146], cena(146))
    const itens = [...main.querySelectorAll('.step-item')]
    const ativos = () => itens.map((i, idx) => (i.classList.contains(CLASSE_PASSO_ATIVO) ? idx + 1 : 0)).filter(Boolean)
    for (const passo of c.passos) {
      tick(passo.inicio + 0.05)
      expect(ativos(), `passo ${passo.texto}`).toEqual([passo.texto])
      expect(d.el.querySelector('.cda-anim-passo')?.textContent).toBe(`Passo ${passo.texto} de 5`)
      expect(itens[passo.texto - 1].getAttribute('aria-current')).toBe('step')
    }
  })

  it('o destaque volta se a lista do passo a passo for redesenhada (troca de aba)', async () => {
    const { main, tick } = montar()
    await Promise.resolve() // deixa o observador de mudanças registrar
    tick(2)
    const lista = main.querySelector('#conteudo')!
    const novo = lista.innerHTML
    lista.innerHTML = ''
    lista.innerHTML = novo
    await vi.waitFor(() => expect(main.querySelector(`.step-item.${CLASSE_PASSO_ATIVO}`)).not.toBeNull())
  })

  it('animação some da tela (render trocou de página): para o relógio sozinha', () => {
    const { main, d, r, tick } = montar()
    tick(0.5) // já esteve na tela
    main.remove()
    tick(1)
    expect(r.parar).toHaveBeenCalled()
    d.destruir() // idempotente
    expect(r.parar).toHaveBeenCalledTimes(1)
  })

  it('destruir limpa o destaque do texto', () => {
    const { main, d, tick } = montar()
    tick(2)
    expect(main.querySelector(`.${CLASSE_PASSO_ATIVO}`)).not.toBeNull()
    d.destruir()
    expect(main.querySelector(`.${CLASSE_PASSO_ATIVO}`)).toBeNull()
  })

  it('no início, nenhuma seta citada na linha do tempo está visível (máscara escondida)', () => {
    const { d } = montar()
    const mascaras = [...d.el.querySelectorAll('mask path')]
    expect(mascaras.length).toBeGreaterThan(0)
    for (const m of mascaras) expect(m.getAttribute('visibility')).toBe('hidden')
  })
})

describe('animarDiagramaDoExercicio: quando anima e quando fica estático', () => {
  const cenaResposta = (n: number) => vi.fn().mockResolvedValue({ ok: true, json: async () => cena(n) })
  const semMovimentoReduzido = () => vi.stubGlobal('matchMedia', (q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} }))

  it('exercício com linha do tempo: troca a imagem pelo diagrama animado', async () => {
    semMovimentoReduzido()
    const main = paginaDeExercicio(5)
    await animarDiagramaDoExercicio(main, 146, cenaResposta(146) as unknown as typeof fetch)
    expect(main.querySelector('.diag-hero img')).toBeNull()
    expect(main.querySelector('.diag-hero .cda-anim svg')).not.toBeNull()
    expect(main.querySelector('.cda-anim-passo')).not.toBeNull()
  })

  it('exercício SEM linha do tempo: continua a imagem estática e nem busca a cena', async () => {
    semMovimentoReduzido()
    const main = paginaDeExercicio(5)
    const buscar = cenaResposta(146)
    await animarDiagramaDoExercicio(main, 7, buscar as unknown as typeof fetch)
    expect(main.querySelector('.diag-hero img')).not.toBeNull()
    expect(buscar).not.toHaveBeenCalled()
  })

  it('"reduzir movimento" ligado: mostra o diagrama estático como hoje', async () => {
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: q.includes('reduce'), media: q, addEventListener() {}, removeEventListener() {} }))
    const main = paginaDeExercicio(5)
    const buscar = cenaResposta(146)
    await animarDiagramaDoExercicio(main, 146, buscar as unknown as typeof fetch)
    expect(main.querySelector('.diag-hero img')).not.toBeNull()
    expect(main.querySelector('.cda-anim')).toBeNull()
    expect(buscar).not.toHaveBeenCalled()
  })

  it('cena que não carrega: fica a imagem estática', async () => {
    semMovimentoReduzido()
    const main = paginaDeExercicio(5)
    await animarDiagramaDoExercicio(main, 146, vi.fn().mockRejectedValue(new Error('offline')) as unknown as typeof fetch)
    expect(main.querySelector('.diag-hero img')).not.toBeNull()
    const main2 = paginaDeExercicio(5)
    await animarDiagramaDoExercicio(main2, 146, vi.fn().mockResolvedValue({ ok: false }) as unknown as typeof fetch)
    expect(main2.querySelector('.diag-hero img')).not.toBeNull()
  })

  it('pessoa saiu da tela antes da cena chegar: não mexe em nada', async () => {
    semMovimentoReduzido()
    const main = paginaDeExercicio(5)
    const img = main.querySelector('.diag-hero img')!
    const promessa = animarDiagramaDoExercicio(main, 146, cenaResposta(146) as unknown as typeof fetch)
    img.remove()
    await promessa
    expect(main.querySelector('.cda-anim')).toBeNull()
  })
})

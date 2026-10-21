// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MODULOS, type ModuloConfig } from '../src/config/modulos'
import { TREINO_CASA } from '../src/data/treinoCasa'
import { Desbloqueio, type Armazenamento } from '../src/lib/desbloqueio'
import { hashDaSenha } from '../src/lib/senha'
import { MSG_SENHA_INCORRETA } from '../src/ui/bloqueado'
import { adicionarCartoesNaHome } from '../src/ui/cartoes'
import type { Contexto } from '../src/ui/contexto'
import { renderRota } from '../src/ui/rotas'

const MODULOS_TESTE: readonly ModuloConfig[] = [
  { ...MODULOS[0], id: 'competicao', hashes: [hashDaSenha('Alfa12')] },
  { ...MODULOS[1], id: 'treino_casa', hashes: [hashDaSenha('Beta34')] },
]

function criarContexto() {
  const dados = new Map<string, string>()
  const storage: Armazenamento = { getItem: (k) => dados.get(k) ?? null, setItem: (k, v) => void dados.set(k, v) }
  const irPara = vi.fn()
  const renderizar = vi.fn()
  const ctx: Contexto = { modulos: MODULOS_TESTE, desbloqueio: new Desbloqueio(MODULOS_TESTE, storage), irPara, renderizar }
  return { ctx, irPara, renderizar }
}

function montar(frag: DocumentFragment | null): HTMLElement {
  const raiz = document.createElement('div')
  if (frag) raiz.append(frag)
  document.body.replaceChildren(raiz)
  return raiz
}

const digitarEEnviar = (form: HTMLFormElement, senha: string) => {
  ;(form.querySelector('input') as HTMLInputElement).value = senha
  form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))
}

beforeEach(() => { document.body.replaceChildren() })

describe('decisão de acesso por rota', () => {
  it('rotas dos exercícios atuais são livres (o app desenha como sempre)', () => {
    const { ctx } = criarContexto()
    for (const nome of ['home', 'secao', 'ex', 'buscar', 'aulas', 'favoritos', 'como-usar']) {
      expect(renderRota(ctx, { name: nome })).toBeNull()
    }
  })

  it('competição e placar bloqueados mostram a tela de bloqueio', () => {
    const { ctx } = criarContexto()
    for (const nome of ['competicao', 'jogo-comp', 'placar']) {
      const tela = montar(renderRota(ctx, { name: nome }))
      expect(tela.textContent).toContain(MODULOS[0].nome)
      expect(tela.querySelector('form')).not.toBeNull()
    }
  })

  it('competição liberada: o app desenha por dentro (nada é trocado)', () => {
    const { ctx } = criarContexto()
    ctx.desbloqueio.liberar('competicao')
    for (const nome of ['competicao', 'jogo-comp', 'placar']) expect(renderRota(ctx, { name: nome })).toBeNull()
  })

  it('treino em casa bloqueado → bloqueio; liberado → a seção', () => {
    const { ctx } = criarContexto()
    expect(montar(renderRota(ctx, { name: 'casa' })).querySelector('form')).not.toBeNull()
    expect(montar(renderRota(ctx, { name: 'casa-ex', id: '1' })).querySelector('form')).not.toBeNull()
    ctx.desbloqueio.liberar('treino_casa')
    const lista = montar(renderRota(ctx, { name: 'casa' }))
    expect(lista.querySelector('form')).toBeNull()
    expect(lista.querySelectorAll('.ex-row')).toHaveLength(TREINO_CASA.length)
  })

  it('desbloquear um módulo não libera o outro', () => {
    const { ctx } = criarContexto()
    ctx.desbloqueio.liberar('competicao')
    expect(montar(renderRota(ctx, { name: 'casa' })).querySelector('form')).not.toBeNull()
  })
})

describe('tela do módulo bloqueado', () => {
  const abrir = () => {
    const c = criarContexto()
    const tela = montar(renderRota(c.ctx, { name: 'competicao' }))
    return { ...c, tela }
  }

  it('mostra nome, descrição, exemplos, preço e o botão de checkout', () => {
    const { tela } = abrir()
    expect(tela.textContent).toContain(MODULOS[0].nome)
    expect(tela.textContent).toContain(MODULOS[0].descricao)
    for (const e of MODULOS[0].exemplos) expect(tela.textContent).toContain(e)
    const comprar = tela.querySelector('a.cda-btn.pri') as HTMLAnchorElement
    expect(comprar.textContent).toBe(`Desbloquear por ${MODULOS[0].preco}`)
    expect(comprar.href).toBe(MODULOS[0].checkoutUrl)
    expect(comprar.target).toBe('_blank')
    expect(comprar.rel).toContain('noopener')
  })

  it('"Já comprei: digitar senha" abre o campo de senha', () => {
    const { tela } = abrir()
    const form = tela.querySelector('form') as HTMLFormElement
    expect(form.classList.contains('cda-oculto')).toBe(true)
    const botao = [...tela.querySelectorAll('button')].find((b) => b.textContent?.includes('Já comprei')) as HTMLButtonElement
    botao.click()
    expect(form.classList.contains('cda-oculto')).toBe(false)
  })

  it('senha certa: libera na hora e abre a seção', () => {
    const { ctx, irPara, tela } = abrir()
    digitarEEnviar(tela.querySelector('form') as HTMLFormElement, ' alfa12 ')
    expect(ctx.desbloqueio.estaDesbloqueado('competicao')).toBe(true)
    expect(irPara).toHaveBeenCalledWith('competicao')
  })

  it('senha errada: mostra a mensagem e o botão de suporte, sem liberar', () => {
    const { ctx, irPara, tela } = abrir()
    const form = tela.querySelector('form') as HTMLFormElement
    digitarEEnviar(form, 'errada')
    const msg = form.querySelector('.cda-msg') as HTMLElement
    expect(msg.classList.contains('cda-oculto')).toBe(false)
    expect(msg.textContent).toBe('Senha incorreta. Confira a mensagem que você recebeu depois da compra.')
    expect(MSG_SENHA_INCORRETA).toBe(msg.textContent)
    const suporte = form.querySelector('a.zap') as HTMLAnchorElement
    expect(suporte.classList.contains('cda-oculto')).toBe(false)
    expect(suporte.textContent).toContain('Falar com o suporte')
    expect(suporte.href).toMatch(/^https:\/\/wa\.me\//)
    expect(ctx.desbloqueio.estaDesbloqueado('competicao')).toBe(false)
    expect(irPara).not.toHaveBeenCalled()
  })
})

describe('cards de bônus na tela inicial', () => {
  const montarHome = (ctx: Contexto) => {
    const main = document.createElement('div')
    main.innerHTML = '<div class="page page-home"><div class="hero"></div><div id="grupos"></div></div>'
    document.body.replaceChildren(main)
    adicionarCartoesNaHome(ctx, main)
    return main
  }

  it('bloqueado: card com cadeado e preço, no estilo dos cards de seção', () => {
    const { ctx, irPara } = criarContexto()
    const main = montarHome(ctx)
    const tiles = main.querySelectorAll('.sec-tile')
    expect(tiles).toHaveLength(2)
    // fica no topo da home, antes do banner
    expect(main.querySelector('.page-home')?.firstElementChild?.getAttribute('data-cda')).toBe('bonus')
    expect(main.querySelector('.cda-bonus + .hero')).not.toBeNull()
    for (const [i, m] of MODULOS_TESTE.entries()) {
      expect(tiles[i].querySelector('.cda-lock-badge')).not.toBeNull()
      expect(tiles[i].textContent).toContain(m.nomeCurto)
      expect(tiles[i].textContent).toContain(m.preco)
    }
    ;(tiles[1] as HTMLElement).click()
    expect(irPara).toHaveBeenCalledWith('casa')
  })

  it('liberado: card normal, sem cadeado nem preço', () => {
    const { ctx } = criarContexto()
    ctx.desbloqueio.liberar('competicao')
    const main = montarHome(ctx)
    const [liberado, bloqueado] = [...main.querySelectorAll('.sec-tile')]
    expect(liberado.querySelector('.cda-lock-badge')).toBeNull()
    expect(liberado.textContent).toContain('Liberado')
    expect(liberado.textContent).not.toContain(MODULOS[0].preco)
    expect(bloqueado.querySelector('.cda-lock-badge')).not.toBeNull()
  })

  it('não duplica os cards ao redesenhar a home', () => {
    const { ctx } = criarContexto()
    const main = montarHome(ctx)
    adicionarCartoesNaHome(ctx, main)
    expect(main.querySelectorAll('[data-cda="bonus"]')).toHaveLength(1)
  })
})

describe('configurações', () => {
  it('lista os módulos e desbloqueia pelo campo "Tenho uma senha"', () => {
    const { ctx, renderizar } = criarContexto()
    const tela = montar(renderRota(ctx, { name: 'configuracoes' }))
    expect(tela.querySelectorAll('.cda-linha')).toHaveLength(2)
    expect(tela.textContent).toContain('Bloqueado')
    digitarEEnviar(tela.querySelector('form') as HTMLFormElement, 'BETA34')
    expect(ctx.desbloqueio.estaDesbloqueado('treino_casa')).toBe(true)
    expect(renderizar).toHaveBeenCalled()
    const depois = montar(renderRota(ctx, { name: 'configuracoes' }))
    expect(depois.textContent).toContain('Desbloqueado')
  })

  it('senha errada mostra a mensagem e o suporte', () => {
    const { ctx } = criarContexto()
    const tela = montar(renderRota(ctx, { name: 'configuracoes' }))
    digitarEEnviar(tela.querySelector('form') as HTMLFormElement, 'xxxx')
    expect(tela.querySelector('.cda-msg.erro')?.textContent).toBe(MSG_SENHA_INCORRETA)
    expect(tela.querySelector('a.zap')?.classList.contains('cda-oculto')).toBe(false)
  })
})

describe('seção Treino em Casa', () => {
  const liberada = () => {
    const c = criarContexto()
    c.ctx.desbloqueio.liberar('treino_casa')
    return c
  }

  it('lista com chips de categoria e cards no mesmo formato das seções', () => {
    const { ctx } = liberada()
    const tela = montar(renderRota(ctx, { name: 'casa' }))
    const chips = [...tela.querySelectorAll('.level-chips .chip')].map((c) => c.getAttribute('data-val'))
    expect(chips).toEqual(['', 'Com bola', 'Impulsão', 'Força', 'Agilidade', 'Coordenação', 'Mobilidade'])
    const card = tela.querySelector('.ex-row') as HTMLElement
    expect(card.querySelector('.ex-row-nome')?.textContent).toBe(TREINO_CASA[0].nome)
    expect(tela.querySelectorAll('.ex-row').length).toBeGreaterThanOrEqual(100)
  })

  it('filtrar por categoria mostra só aquela categoria', () => {
    const { ctx } = liberada()
    const tela = montar(renderRota(ctx, { name: 'casa' }))
    const chip = tela.querySelector('.chip[data-val="Impulsão"]') as HTMLElement
    chip.click()
    const nomes = [...tela.querySelectorAll('.ex-row-nome')].map((n) => n.textContent)
    expect(nomes).toEqual(TREINO_CASA.filter((e) => e.categoria === 'Impulsão').map((e) => e.nome))
    ;(tela.querySelector('.chip[data-val=""]') as HTMLElement).click()
    expect(tela.querySelectorAll('.ex-row')).toHaveLength(TREINO_CASA.length)
  })

  it('detalhe tem objetivo, passo a passo, material, séries/tempo e variações por nível', () => {
    const { ctx } = liberada()
    const ex = TREINO_CASA[1]
    const tela = montar(renderRota(ctx, { name: 'casa-ex', id: String(ex.numero) }))
    expect(tela.querySelector('.ex-titulo')?.textContent).toBe(ex.nome)
    expect(tela.textContent).toContain(ex.tempo)
    expect(tela.textContent).toContain(ex.material)
    expect(tela.textContent).toContain(ex.objetivo)
    expect(tela.querySelectorAll('.step-item')).toHaveLength(ex.passoAPasso.length)
    const aba = (k: string) => (tela.querySelector(`.seg button[data-k="${k}"]`) as HTMLElement).click()
    aba('variar')
    expect(tela.querySelector('.caixa-facil')?.textContent).toContain(ex.variacaoFacil)
    expect(tela.querySelector('.caixa-dificil')?.textContent).toContain(ex.variacaoDificil)
    aba('corrigir')
    expect(tela.textContent).toContain(ex.erroComum ?? '')
  })

  it('"Compartilhar com aluno" usa navigator.share quando existe', async () => {
    const { ctx } = liberada()
    const share = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'share', { value: share, configurable: true })
    const tela = montar(renderRota(ctx, { name: 'casa-ex', id: '1' }))
    ;(tela.querySelector('[data-acao="compartilhar"]') as HTMLElement).click()
    await vi.waitFor(() => expect(share).toHaveBeenCalled())
    expect(share.mock.calls[0][0].text).toContain(TREINO_CASA[0].nome)
    Reflect.deleteProperty(navigator, 'share')
  })

  it('sem navigator.share, copia o texto e avisa', async () => {
    const { ctx } = liberada()
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    const tela = montar(renderRota(ctx, { name: 'casa-ex', id: '1' }))
    ;(tela.querySelector('[data-acao="compartilhar"]') as HTMLElement).click()
    await vi.waitFor(() => expect(writeText).toHaveBeenCalled())
    await vi.waitFor(() => expect(document.querySelector('.cda-aviso')?.textContent).toContain('copiado'))
  })

  it('exercício inexistente volta para a lista', () => {
    const { ctx, irPara } = liberada()
    montar(renderRota(ctx, { name: 'casa-ex', id: '9999' }))
    expect(irPara).toHaveBeenCalledWith('casa')
  })
})

// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { MODULOS } from '../src/config/modulos'
import { Desbloqueio, type Armazenamento } from '../src/lib/desbloqueio'
import type { Contexto } from '../src/ui/contexto'
import { sincronizarNavegacao } from '../src/ui/navegacao'

const ROTAS_ORIGINAIS = ['home', 'buscar', 'aulas', 'favoritos', 'como-usar']

function criar() {
  const dados = new Map<string, string>()
  const storage: Armazenamento = { getItem: (k) => dados.get(k) ?? null, setItem: (k, v) => void dados.set(k, v) }
  const ctx: Contexto = { modulos: MODULOS, desbloqueio: new Desbloqueio(MODULOS, storage), irPara: () => {}, renderizar: () => {} }
  return ctx
}

const rotasDaBarra = () => [...document.querySelectorAll('.bottom-nav .nav-item')].map((b) => b.getAttribute('data-route'))

beforeEach(() => {
  document.body.innerHTML = `<nav class="bottom-nav">${ROTAS_ORIGINAIS.map((r) => `<button class="nav-item" data-route="${r}">${r}</button>`).join('')}</nav>`
})

describe('aba do bônus na barra de baixo', () => {
  it('só a competição tem aba; o Treino em Casa não', () => {
    expect(MODULOS.find((m) => m.id === 'competicao')?.nav).toBeDefined()
    expect(MODULOS.find((m) => m.id === 'treino_casa')?.nav).toBeUndefined()
  })

  it('bloqueado: a barra fica com as 5 abas originais', () => {
    sincronizarNavegacao(criar())
    expect(rotasDaBarra()).toEqual(ROTAS_ORIGINAIS)
  })

  it('liberado: "Compet." entra entre Aulas e Salvos, em destaque', () => {
    const ctx = criar()
    ctx.desbloqueio.liberar('competicao')
    sincronizarNavegacao(ctx)
    expect(rotasDaBarra()).toEqual(['home', 'buscar', 'aulas', 'competicao', 'favoritos', 'como-usar'])
    const aba = document.querySelector('[data-route="competicao"]') as HTMLElement
    expect(aba.textContent).toBe('Compet.')
    expect(aba.classList.contains('cda-destaque')).toBe(true)
    expect(aba.querySelector('svg')).not.toBeNull()
  })

  it('chamar de novo não duplica a aba', () => {
    const ctx = criar()
    ctx.desbloqueio.liberar('competicao')
    sincronizarNavegacao(ctx)
    sincronizarNavegacao(ctx)
    sincronizarNavegacao(ctx)
    expect(document.querySelectorAll('[data-route="competicao"]')).toHaveLength(1)
  })

  it('liberar o Treino em Casa não acrescenta aba', () => {
    const ctx = criar()
    ctx.desbloqueio.liberar('treino_casa')
    sincronizarNavegacao(ctx)
    expect(rotasDaBarra()).toEqual(ROTAS_ORIGINAIS)
  })

  it('a aba some se o módulo voltar a ficar bloqueado', () => {
    const ctx = criar()
    ctx.desbloqueio.liberar('competicao')
    sincronizarNavegacao(ctx)
    const bloqueado = { ...ctx, desbloqueio: new Desbloqueio(MODULOS, { getItem: () => null, setItem: () => {} }) }
    sincronizarNavegacao(bloqueado)
    expect(rotasDaBarra()).toEqual(ROTAS_ORIGINAIS)
  })

  it('sem a aba de referência, entra no fim da barra', () => {
    document.querySelector('[data-route="favoritos"]')?.remove()
    const ctx = criar()
    ctx.desbloqueio.liberar('competicao')
    sincronizarNavegacao(ctx)
    expect(rotasDaBarra().at(-1)).toBe('competicao')
  })
})

import { describe, expect, it } from 'vitest'
import { MODULOS, type ModuloConfig } from '../src/config/modulos'
import {
  CHAVE_DESBLOQUEADOS,
  Desbloqueio,
  PREFIXO_STORAGE,
  aplicarParametroDeUrl,
  aplicarRotaLegada,
  type Armazenamento,
} from '../src/lib/desbloqueio'
import { hashDaSenha } from '../src/lib/senha'

// Módulos de teste com senhas FALSAS (as reais só existem como hash na configuração).
const MODULOS_TESTE: readonly ModuloConfig[] = [
  { ...MODULOS[0], id: 'competicao', hashes: [hashDaSenha('Alfa12')] },
  { ...MODULOS[1], id: 'treino_casa', hashes: [hashDaSenha('Beta34'), hashDaSenha('Beta99')] },
]

function armazenamentoFalso(): Armazenamento & { dados: Map<string, string> } {
  const dados = new Map<string, string>()
  return { dados, getItem: (k) => dados.get(k) ?? null, setItem: (k, v) => void dados.set(k, v) }
}

const novo = (storage: Armazenamento | null = armazenamentoFalso()) => new Desbloqueio(MODULOS_TESTE, storage)

describe('desbloqueio por senha', () => {
  it('começa tudo bloqueado', () => {
    expect(novo().listar()).toEqual([])
    expect(novo().estaDesbloqueado('competicao')).toBe(false)
  })

  it('senha certa libera o módulo', () => {
    const d = novo()
    expect(d.tentarSenha('competicao', 'Alfa12')).toBe(true)
    expect(d.estaDesbloqueado('competicao')).toBe(true)
    expect(d.estaDesbloqueado('treino_casa')).toBe(false)
  })

  it('senha errada não libera nada', () => {
    const d = novo()
    expect(d.tentarSenha('competicao', 'errada')).toBe(false)
    expect(d.estaDesbloqueado('competicao')).toBe(false)
  })

  it('a senha de um módulo não abre o outro', () => {
    const d = novo()
    expect(d.tentarSenha('competicao', 'Beta34')).toBe(false)
    expect(d.tentarSenha('treino_casa', 'Alfa12')).toBe(false)
  })

  it('senha com maiúsculas e espaços funciona', () => {
    const d = novo()
    expect(d.tentarSenha('competicao', '  ALFA12 ')).toBe(true)
    expect(d.tentarSenha('treino_casa', ' beta34')).toBe(true)
  })

  it('módulo inexistente nunca libera', () => {
    expect(novo().tentarSenha('nao_existe', 'Alfa12')).toBe(false)
  })

  it('senha nova e antiga do mesmo módulo valem (troca de senha sem tirar acesso)', () => {
    expect(novo().tentarSenha('treino_casa', 'Beta99')).toBe(true)
  })

  it('"Tenho uma senha" testa todos os módulos e libera os que baterem', () => {
    const d = novo()
    expect(d.tentarSenhaEmTodos('Beta99').map((m) => m.id)).toEqual(['treino_casa'])
    expect(d.estaDesbloqueado('treino_casa')).toBe(true)
    expect(d.tentarSenhaEmTodos('nada')).toEqual([])
  })
})

describe('persistência no aparelho (prefixo cda_)', () => {
  it('guarda numa chave com prefixo cda_ e sobrevive a reabrir o app', () => {
    const storage = armazenamentoFalso()
    novo(storage).tentarSenha('competicao', 'Alfa12')
    expect(CHAVE_DESBLOQUEADOS.startsWith(PREFIXO_STORAGE)).toBe(true)
    expect([...storage.dados.keys()].every((k) => k.startsWith('cda_'))).toBe(true)
    expect(novo(storage).estaDesbloqueado('competicao')).toBe(true)
  })

  it('não perde um módulo ao liberar outro', () => {
    const storage = armazenamentoFalso()
    const d = novo(storage)
    d.liberar('competicao')
    d.liberar('treino_casa')
    expect(novo(storage).listar().sort()).toEqual(['competicao', 'treino_casa'])
  })

  it('valor corrompido no storage é ignorado sem quebrar', () => {
    const storage = armazenamentoFalso()
    storage.dados.set(CHAVE_DESBLOQUEADOS, '{isso não é json')
    expect(novo(storage).listar()).toEqual([])
    storage.dados.set(CHAVE_DESBLOQUEADOS, '"texto"')
    expect(novo(storage).listar()).toEqual([])
    storage.dados.set(CHAVE_DESBLOQUEADOS, '[1, null, "competicao"]')
    expect(novo(storage).listar()).toEqual(['competicao'])
  })

  it('sem localStorage (modo privado) segue funcionando na visita atual', () => {
    const d = novo(null)
    expect(d.tentarSenha('competicao', 'Alfa12')).toBe(true)
    expect(d.estaDesbloqueado('competicao')).toBe(true)
  })

  it('localStorage que lança erro ao gravar não derruba o app', () => {
    const quebrado: Armazenamento = { getItem: () => null, setItem: () => { throw new Error('cheio') } }
    const d = novo(quebrado)
    expect(() => d.liberar('competicao')).not.toThrow()
    expect(d.estaDesbloqueado('competicao')).toBe(true)
  })
})

describe('desbloqueio por link: ?desbloquear=SENHA', () => {
  it('senha certa libera e tira o parâmetro da URL', () => {
    const d = novo()
    const r = aplicarParametroDeUrl('https://app.exemplo/?desbloquear=Alfa12', d)
    expect(r.tinhaParametro).toBe(true)
    expect(r.liberados.map((m) => m.id)).toEqual(['competicao'])
    expect(r.urlLimpa).toBe('/')
    expect(d.estaDesbloqueado('competicao')).toBe(true)
  })

  it('mantém os outros parâmetros e o #hash', () => {
    const r = aplicarParametroDeUrl('https://app.exemplo/?utm_source=zap&desbloquear=beta34&x=1#secao-3', novo())
    expect(r.urlLimpa).toBe('/?utm_source=zap&x=1#secao-3')
    expect(r.liberados.map((m) => m.id)).toEqual(['treino_casa'])
  })

  it('senha errada: não libera, mas o parâmetro sai da URL', () => {
    const d = novo()
    const r = aplicarParametroDeUrl('https://app.exemplo/?desbloquear=errada', d)
    expect(r.tinhaParametro).toBe(true)
    expect(r.liberados).toEqual([])
    expect(r.urlLimpa).toBe('/')
    expect(d.listar()).toEqual([])
  })

  it('senha com espaços e maiúsculas (codificados na URL) funciona', () => {
    const d = novo()
    aplicarParametroDeUrl('https://app.exemplo/?desbloquear=%20ALFA12%20', d)
    expect(d.estaDesbloqueado('competicao')).toBe(true)
  })

  it('sem o parâmetro não faz nada', () => {
    const d = novo()
    const r = aplicarParametroDeUrl('https://app.exemplo/?x=1#home', d)
    expect(r.tinhaParametro).toBe(false)
    expect(r.urlLimpa).toBe('/?x=1#home')
    expect(d.listar()).toEqual([])
  })

  it('parâmetro vazio não libera nada', () => {
    const d = novo()
    expect(aplicarParametroDeUrl('https://app.exemplo/?desbloquear=', d).liberados).toEqual([])
  })
})

describe('rota antiga /modo-competicao', () => {
  it('libera a competição para quem já comprou', () => {
    for (const caminho of ['/modo-competicao', '/modo-competicao/', '/modo-competicao/qualquer/coisa']) {
      const d = novo()
      expect(aplicarRotaLegada(caminho, d)).toBe(true)
      expect(d.estaDesbloqueado('competicao')).toBe(true)
      expect(d.estaDesbloqueado('treino_casa')).toBe(false)
    }
  })

  it('não mexe em nenhum outro caminho', () => {
    for (const caminho of ['/', '/index.html', '/modo-competicaoX', '/outra/modo-competicao']) {
      const d = novo()
      expect(aplicarRotaLegada(caminho, d)).toBe(false)
      expect(d.listar()).toEqual([])
    }
  })
})

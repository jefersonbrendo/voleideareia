import { MODULO_DA_ROTA_LEGADA, PARAMETRO_DESBLOQUEIO, ROTA_LEGADA, type ModuloConfig } from '../config/modulos'
import { senhaConfere } from './senha'

/** Todas as chaves do app no aparelho começam com este prefixo. */
export const PREFIXO_STORAGE = 'cda_'
export const CHAVE_DESBLOQUEADOS = `${PREFIXO_STORAGE}desbloqueados`

export interface Armazenamento {
  getItem(chave: string): string | null
  setItem(chave: string, valor: string): void
}

/** localStorage pode lançar erro (modo privado, bloqueio de cookies): nesse caso o app segue sem salvar. */
export function armazenamentoDoNavegador(): Armazenamento | null {
  try {
    const teste = `${PREFIXO_STORAGE}teste`
    window.localStorage.setItem(teste, '1')
    window.localStorage.removeItem(teste)
    return window.localStorage
  } catch {
    return null
  }
}

export class Desbloqueio {
  private memoria = new Set<string>()

  constructor(
    private readonly modulos: readonly ModuloConfig[],
    private readonly storage: Armazenamento | null,
  ) {}

  /** Ids dos módulos liberados neste aparelho. */
  listar(): string[] {
    const ids = new Set(this.memoria)
    if (this.storage) {
      try {
        const bruto = this.storage.getItem(CHAVE_DESBLOQUEADOS)
        const lista: unknown = bruto ? JSON.parse(bruto) : []
        if (Array.isArray(lista)) for (const id of lista) if (typeof id === 'string') ids.add(id)
      } catch {
        /* valor corrompido: ignora */
      }
    }
    return [...ids]
  }

  estaDesbloqueado(id: string): boolean {
    return this.listar().includes(id)
  }

  liberar(id: string): void {
    this.memoria.add(id)
    if (!this.storage) return
    try {
      this.storage.setItem(CHAVE_DESBLOQUEADOS, JSON.stringify([...new Set([...this.listar(), id])]))
    } catch {
      /* sem espaço ou bloqueado: fica só na memória desta visita */
    }
  }

  /** Confere a senha contra UM módulo (tela do módulo bloqueado). Libera se estiver certa. */
  tentarSenha(id: string, senha: string): boolean {
    const modulo = this.modulos.find((m) => m.id === id)
    if (!modulo || !senhaConfere(senha, modulo.hashes)) return false
    this.liberar(modulo.id)
    return true
  }

  /** Confere a senha contra TODOS os módulos (Configurações e link). Libera os que baterem. */
  tentarSenhaEmTodos(senha: string): ModuloConfig[] {
    const certos = this.modulos.filter((m) => senhaConfere(senha, m.hashes))
    for (const m of certos) this.liberar(m.id)
    return certos
  }
}

export interface ResultadoUrl {
  /** true se a URL tinha ?desbloquear=. */
  tinhaParametro: boolean
  liberados: ModuloConfig[]
  /** Endereço sem o parâmetro (caminho + query + hash), para trocar na barra de endereços. */
  urlLimpa: string
}

/** ?desbloquear=SENHA: valida, libera e devolve a URL sem o parâmetro. */
export function aplicarParametroDeUrl(href: string, desbloqueio: Desbloqueio): ResultadoUrl {
  const url = new URL(href)
  const senha = url.searchParams.get(PARAMETRO_DESBLOQUEIO)
  if (senha === null) return { tinhaParametro: false, liberados: [], urlLimpa: url.pathname + url.search + url.hash }
  const liberados = desbloqueio.tentarSenhaEmTodos(senha)
  url.searchParams.delete(PARAMETRO_DESBLOQUEIO)
  return { tinhaParametro: true, liberados, urlLimpa: url.pathname + url.search + url.hash }
}

/**
 * Rota antiga /modo-competicao: quem já comprou a competição não pode perder o acesso.
 * Libera o módulo e diz que a barra de endereços deve voltar para a raiz do app.
 */
export function aplicarRotaLegada(pathname: string, desbloqueio: Desbloqueio): boolean {
  const caminho = pathname.replace(/\/+$/, '')
  if (caminho !== ROTA_LEGADA && !caminho.startsWith(`${ROTA_LEGADA}/`)) return false
  desbloqueio.liberar(MODULO_DA_ROTA_LEGADA)
  return true
}

import type { ModuloConfig } from '../config/modulos'
import type { Desbloqueio } from '../lib/desbloqueio'

/** O que as telas precisam para funcionar: dados, estado do desbloqueio e navegação. */
export interface Contexto {
  modulos: readonly ModuloConfig[]
  desbloqueio: Desbloqueio
  /** Vai para uma rota do app (ex.: 'casa'); redesenha mesmo se já estiver nela. */
  irPara(rota: string): void
  /** Redesenha a tela atual. */
  renderizar(): void
}

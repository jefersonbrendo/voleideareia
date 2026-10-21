import type { ModuloConfig } from '../config/modulos'

/** Rota do app (nome devolvido pelo getRoute do index.html). */
export interface Rota {
  name: string
  [chave: string]: unknown
}

/** Módulo dono de uma rota, ou undefined se a rota é livre (exercícios atuais). */
export function moduloDaRota(modulos: readonly ModuloConfig[], nomeDaRota: string): ModuloConfig | undefined {
  return modulos.find((m) => m.rotas.includes(nomeDaRota))
}

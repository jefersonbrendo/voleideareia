import type { ModuloConfig } from '../config/modulos'
import { moduloDaRota, type Rota } from '../lib/rotas'
import { renderBloqueado } from './bloqueado'
import { renderConfiguracoes } from './configuracoes'
import type { Contexto } from './contexto'
import { renderExercicioCasa, renderListaTreinoCasa } from './treinoCasa'

type Desenhar = (ctx: Contexto, modulo: ModuloConfig, rota: Rota) => DocumentFragment | null

/**
 * Como cada módulo liberado desenha suas rotas.
 * Módulo sem entrada aqui (ex.: competição) é desenhado pelo próprio app: devolvemos null.
 */
const DESENHO_DOS_MODULOS: Record<string, Desenhar> = {
  treino_casa: (ctx, modulo, rota) =>
    rota.name === 'casa-ex' ? renderExercicioCasa(ctx, modulo, String(rota.id ?? '')) : renderListaTreinoCasa(modulo),
}

/**
 * Único ponto de decisão de acesso do app. Para cada rota:
 *  - rota livre (exercícios atuais) ............. null (o app desenha como sempre)
 *  - módulo bloqueado ........................... tela de bloqueio
 *  - módulo liberado ............................ tela do módulo, ou null se o app já a desenha
 */
export function renderRota(ctx: Contexto, rota: Rota): DocumentFragment | null {
  if (rota.name === 'configuracoes') return renderConfiguracoes(ctx)
  const modulo = moduloDaRota(ctx.modulos, rota.name)
  if (!modulo) return null
  if (!ctx.desbloqueio.estaDesbloqueado(modulo.id)) return renderBloqueado(ctx, modulo)
  return DESENHO_DOS_MODULOS[modulo.id]?.(ctx, modulo, rota) ?? null
}

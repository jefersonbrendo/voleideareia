import type { Contexto } from './contexto'
import { h, svg } from './dom'

/**
 * Barra de baixo: módulos liberados que têm `nav` na configuração ganham uma aba (ex.: Compet.,
 * em destaque, antes de Salvos). Bloqueado, a aba não existe e a barra fica com as abas originais.
 * Pode ser chamada quantas vezes quiser: não duplica nem deixa aba sobrando.
 */
export function sincronizarNavegacao(ctx: Contexto, barra: ParentNode | null = document.querySelector('.bottom-nav')): void {
  if (!barra) return
  for (const m of ctx.modulos) {
    if (!m.nav) continue
    const existente = barra.querySelector(`[data-nav-modulo="${m.id}"]`)
    if (!ctx.desbloqueio.estaDesbloqueado(m.id)) {
      existente?.remove()
      continue
    }
    if (existente) continue

    const aba = h('button', { cls: `nav-item${m.nav.destaque ? ' cda-destaque' : ''}`, 'data-route': m.rota, 'data-nav-modulo': m.id, 'aria-label': m.nome })
    aba.innerHTML = `${svg(m.icone)}${m.nav.rotulo}`
    const referencia = barra.querySelector(`[data-route="${m.nav.antesDe}"]`)
    if (referencia) referencia.before(aba)
    else barra.append(aba)
  }
}

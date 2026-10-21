import type { Contexto } from './contexto'
import { h, svg, ICONES } from './dom'

/**
 * Cards dos order bumps na tela inicial, no mesmo estilo dos cards de seção (sec-tile).
 * Fica num bloco irmão dos grupos de seções, então sobrevive ao filtro por nível.
 */
export function adicionarCartoesNaHome(ctx: Contexto, main: ParentNode): void {
  const pagina = main.querySelector('.page-home')
  if (!pagina) return
  pagina.querySelector('[data-cda="bonus"]')?.remove()

  const tiles = h('div', { cls: 'sec-tiles' })
  for (const m of ctx.modulos) {
    const liberado = ctx.desbloqueio.estaDesbloqueado(m.id)
    const topo = h('div', { cls: 'sec-tile-top' },
      h('span', { cls: 'sec-ico', html: svg(m.icone, 'sec-ico') }),
      h('span', { cls: 'sec-abrev' }, 'BÔNUS'),
      liberado ? null : h('span', { cls: 'cda-lock-badge', html: svg(ICONES.cadeado), 'aria-hidden': 'true' }),
    )
    const estado = liberado
      ? h('span', { cls: 'cda-liberado', html: `${svg(ICONES.cadeadoAberto)}Liberado` })
      : h('span', { cls: 'cda-preco', html: `${svg(ICONES.cadeado)}${m.preco}` })
    const tile = h('button', { cls: `sec-tile ${m.cor}${liberado ? '' : ' cda-bloqueado'}`, 'data-modulo': m.id, 'aria-label': `${m.nomeCurto}${liberado ? '' : ', bloqueado, ' + m.preco}` },
      topo,
      h('div', { cls: 'sec-tile-body' }, h('span', { cls: 'sec-tile-nome' }, m.nomeCurto), estado),
    )
    tile.addEventListener('click', () => ctx.irPara(m.rota))
    tiles.append(tile)
  }

  pagina.append(
    h('section', { cls: 'cda-bonus', 'data-cda': 'bonus' },
      h('h2', { cls: 'bloco-titulo' }, 'Bônus'),
      h('p', { cls: 'bloco-sub' }, 'Conteúdos extras. Desbloqueie com a senha que você recebe na compra.'),
      tiles,
    ),
  )
}

import './estilos/acesso.css'
import { MODULOS } from './config/modulos'
import { Desbloqueio, aplicarParametroDeUrl, aplicarRotaLegada, armazenamentoDoNavegador } from './lib/desbloqueio'
import { mostrarAviso } from './ui/aviso'
import { adicionarCartoesNaHome } from './ui/cartoes'
import type { Contexto } from './ui/contexto'
import { sincronizarNavegacao } from './ui/navegacao'
import { renderRota } from './ui/rotas'

const desbloqueio = new Desbloqueio(MODULOS, armazenamentoDoNavegador())

const ctx: Contexto = {
  modulos: MODULOS,
  desbloqueio,
  renderizar: () => window.__cdaRender?.(),
  irPara(rota) {
    // Se já estamos nesse endereço, o navegador não dispara hashchange: redesenhamos na mão.
    if (window.location.hash === `#${rota}`) ctx.renderizar()
    else window.location.hash = `#${rota}`
  },
}

window.CDA = {
  renderRota: (rota) => renderRota(ctx, rota),
  aposRender: (rota, main) => {
    sincronizarNavegacao(ctx)
    if (rota.name === 'home') adicionarCartoesNaHome(ctx, main)
  },
}

function tratarEntrada(): void {
  // Link antigo de quem já comprou a competição: libera e volta para a raiz do app.
  if (aplicarRotaLegada(window.location.pathname, desbloqueio)) {
    window.history.replaceState(null, '', `/${window.location.search}${window.location.hash}`)
    mostrarAviso('Exercícios de Competição liberados neste aparelho.')
  }

  // Link da mensagem de entrega: /?desbloquear=SENHA
  const url = aplicarParametroDeUrl(window.location.href, desbloqueio)
  if (url.tinhaParametro) {
    window.history.replaceState(null, '', url.urlLimpa)
    mostrarAviso(url.liberados.length > 0 ? `Liberado: ${url.liberados.map((m) => m.nomeCurto).join(', ')}` : 'Link de desbloqueio inválido.')
  }
}

tratarEntrada()
ctx.renderizar()

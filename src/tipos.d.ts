import type { Rota } from './lib/rotas'

declare global {
  interface Window {
    /** Gancho que o index.html usa para consultar a camada de acesso. */
    CDA?: {
      /** Tela do módulo (ou bloqueio/configurações) para a rota; null = o app desenha como sempre. */
      renderRota(rota: Rota): DocumentFragment | null
      /** Chamado depois de cada tela desenhada (ex.: põe os cards de bônus na tela inicial). */
      aposRender(rota: Rota, main: ParentNode): void
    }
    /** render() do index.html, exposto para a camada de acesso redesenhar a tela. */
    __cdaRender?: () => void
  }
}

export {}

/** WhatsApp do suporte, só dígitos com DDI (ex.: '5511999999999'). */
export const NUMERO_SUPORTE = '558587200301'

/** O mesmo número, do jeito que aparece na tela. */
export const NUMERO_SUPORTE_EXIBIDO = '(85) 8720-0301'

export const MENSAGEM_SUPORTE = 'Olá! Preciso de ajuda para liberar meu acesso no Código da Areia.'

/** Mensagem do botão de suporte das Configurações (dúvida geral, não só senha). */
export const MENSAGEM_SUPORTE_GERAL = 'Olá! Preciso de ajuda com o app Código da Areia.'

export function linkSuporte(mensagem: string = MENSAGEM_SUPORTE): string {
  const numero = NUMERO_SUPORTE.replace(/\D/g, '')
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`
}

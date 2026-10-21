/**
 * WhatsApp do suporte, só dígitos com DDI (ex.: '5511999999999').
 * PENDENTE: preencher antes de publicar. Enquanto estiver vazio, o botão abre o WhatsApp sem
 * contato definido (wa.me/?text=...), com a mensagem pronta.
 */
export const NUMERO_SUPORTE = ''

export const MENSAGEM_SUPORTE = 'Olá! Preciso de ajuda para liberar meu acesso no Código da Areia.'

export function linkSuporte(mensagem: string = MENSAGEM_SUPORTE): string {
  const numero = NUMERO_SUPORTE.replace(/\D/g, '')
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`
}

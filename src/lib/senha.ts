import { sha256Hex } from './sha256'

/** Ignora maiúsculas/minúsculas e espaços no começo e no fim. */
export function normalizarSenha(senha: string): string {
  return senha.trim().toLowerCase()
}

/** Hash SHA-256 (hex) da senha normalizada: é isto que fica na configuração, nunca a senha. */
export function hashDaSenha(senha: string): string {
  return sha256Hex(normalizarSenha(senha))
}

export function senhaConfere(senha: string, hashes: readonly string[]): boolean {
  if (!normalizarSenha(senha)) return false
  return hashes.includes(hashDaSenha(senha))
}

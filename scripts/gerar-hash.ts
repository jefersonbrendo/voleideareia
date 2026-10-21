// Uso: npm run gerar-hash -- SENHA
// Imprime o hash para colar em `hashes` no src/config/modulos.ts.
// Maiúsculas/minúsculas e espaços nas pontas são ignorados, igual à validação do app.
import { hashDaSenha, normalizarSenha } from '../src/lib/senha'

const senha = process.argv.slice(2).join(' ')

if (!normalizarSenha(senha)) {
  console.error('Uso: npm run gerar-hash -- SENHA')
  process.exit(1)
}

console.log(hashDaSenha(senha))

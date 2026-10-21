import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { sha256Hex } from '../src/lib/sha256'
import { hashDaSenha, normalizarSenha, senhaConfere } from '../src/lib/senha'

const sha = (t: string) => createHash('sha256').update(t, 'utf8').digest('hex')

describe('sha256Hex (JS puro)', () => {
  it('bate com o SHA-256 do Node em vários tamanhos e acentos', () => {
    const casos = ['', 'a', 'abc', 'texto de teste', 'senha com espaço', 'ação-é-ü', 'x'.repeat(55), 'x'.repeat(56), 'x'.repeat(64), 'x'.repeat(1000)]
    for (const c of casos) expect(sha256Hex(c)).toBe(sha(c))
  })

  it('vetor conhecido do padrão: "abc"', () => {
    expect(sha256Hex('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
  })
})

describe('validação de senha', () => {
  const hash = hashDaSenha('Teste1')

  it('senha certa', () => {
    expect(senhaConfere('Teste1', [hash])).toBe(true)
  })

  it('senha errada', () => {
    expect(senhaConfere('Teste2', [hash])).toBe(false)
    expect(senhaConfere('Teste', [hash])).toBe(false)
  })

  it('ignora maiúsculas e minúsculas', () => {
    expect(senhaConfere('TESTE1', [hash])).toBe(true)
    expect(senhaConfere('teste1', [hash])).toBe(true)
    expect(senhaConfere('tEsTe1', [hash])).toBe(true)
  })

  it('ignora espaços no começo e no fim, mas não no meio', () => {
    expect(senhaConfere('  Teste1  ', [hash])).toBe(true)
    expect(senhaConfere('\tTeste1\n', [hash])).toBe(true)
    expect(senhaConfere('Tes te1', [hash])).toBe(false)
  })

  it('campo vazio ou só espaços nunca confere', () => {
    expect(senhaConfere('', [hash])).toBe(false)
    expect(senhaConfere('   ', [hash])).toBe(false)
    expect(senhaConfere('   ', [hashDaSenha('')])).toBe(false)
  })

  it('aceita vários hashes: a senha antiga e a nova valem', () => {
    const lista = [hashDaSenha('antiga1'), hashDaSenha('nova2')]
    expect(senhaConfere('ANTIGA1', lista)).toBe(true)
    expect(senhaConfere(' nova2 ', lista)).toBe(true)
    expect(senhaConfere('outra3', lista)).toBe(false)
  })

  it('hash é o SHA-256 da senha normalizada', () => {
    expect(hashDaSenha('  AbC ')).toBe(sha('abc'))
    expect(normalizarSenha('  AbC ')).toBe('abc')
  })
})

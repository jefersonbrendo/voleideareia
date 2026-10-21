import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'
import { MODULOS } from '../src/config/modulos'
import { CATEGORIAS_CASA, NIVEIS_CASA, TREINO_CASA } from '../src/data/treinoCasa'
import { sha256Hex } from '../src/lib/sha256'

const RAIZ = join(__dirname, '..')

describe('configuração dos módulos', () => {
  it('tem os dois bônus esperados', () => {
    expect(MODULOS.map((m) => m.id)).toEqual(['competicao', 'treino_casa'])
  })

  it('ids, rotas de entrada e rotas internas não se repetem', () => {
    const rotas = MODULOS.flatMap((m) => m.rotas)
    expect(new Set(MODULOS.map((m) => m.id)).size).toBe(MODULOS.length)
    expect(new Set(rotas).size).toBe(rotas.length)
    for (const m of MODULOS) expect(m.rotas).toContain(m.rota)
  })

  it('só guarda hashes SHA-256 (64 caracteres hex), pelo menos um por módulo', () => {
    for (const m of MODULOS) {
      expect(m.hashes.length).toBeGreaterThan(0)
      for (const h of m.hashes) expect(h).toMatch(/^[0-9a-f]{64}$/)
    }
  })

  it('tem nome, descrição, preço, checkout seguro e 2 ou 3 exemplos', () => {
    for (const m of MODULOS) {
      expect(m.nome.length).toBeGreaterThan(5)
      expect(m.descricao.length).toBeGreaterThan(20)
      expect(m.preco).toMatch(/^R\$ \d+,\d{2}$/)
      expect(m.checkoutUrl).toMatch(/^https:\/\/pay\.lowify\.com\.br\/checkout\?product_id=\w+$/)
      expect(m.exemplos.length).toBeGreaterThanOrEqual(2)
      expect(m.exemplos.length).toBeLessThanOrEqual(3)
    }
  })
})

describe('nenhuma senha em texto no projeto', () => {
  // Sem conhecer a senha: toda "palavra" dos arquivos é transformada em hash e comparada com os
  // hashes configurados. Se alguma bater, a senha está escrita em texto em algum arquivo.
  function arquivos(pasta: string): string[] {
    const saida: string[] = []
    for (const nome of readdirSync(pasta)) {
      if (['node_modules', 'dist', '.git', 'mc-src', 'public', 'dados'].includes(nome)) continue
      const caminho = join(pasta, nome)
      if (statSync(caminho).isDirectory()) saida.push(...arquivos(caminho))
      else if (/\.(ts|mts|json|html|md|css|toml|example)$/.test(nome) && nome !== 'package-lock.json') saida.push(caminho)
    }
    return saida
  }

  it('nenhum arquivo versionado contém a senha de nenhum módulo', () => {
    const hashes = new Set(MODULOS.flatMap((m) => m.hashes))
    const achados: string[] = []
    for (const arquivo of arquivos(RAIZ)) {
      const palavras = new Set(readFileSync(arquivo, 'utf8').match(/[A-Za-z0-9]{3,16}/g) ?? [])
      for (const p of palavras) if (hashes.has(sha256Hex(p.toLowerCase()))) achados.push(`${relative(RAIZ, arquivo)}: "${p.slice(0, 1)}***"`)
    }
    expect(achados).toEqual([])
  })
})

describe('dados do Treino em Casa', () => {
  it('números únicos, inteiros e positivos (viram o endereço do exercício)', () => {
    const numeros = TREINO_CASA.map((e) => e.numero)
    expect(new Set(numeros).size).toBe(numeros.length)
    for (const n of numeros) expect(Number.isInteger(n) && n > 0).toBe(true)
  })

  it('categoria e nível válidos', () => {
    for (const e of TREINO_CASA) {
      expect(CATEGORIAS_CASA).toContain(e.categoria)
      expect(NIVEIS_CASA).toContain(e.nivel)
    }
  })

  it('campos obrigatórios preenchidos', () => {
    for (const e of TREINO_CASA) {
      for (const campo of ['nome', 'tempo', 'material', 'objetivo', 'variacaoFacil', 'variacaoDificil'] as const) {
        expect(e[campo].trim(), `${e.nome}: ${campo}`).not.toBe('')
      }
      expect(e.passoAPasso.length).toBeGreaterThan(0)
      for (const p of e.passoAPasso) expect(p.trim()).not.toBe('')
    }
  })

  it('tem pelo menos 100 exercícios, e bem distribuídos entre as categorias', () => {
    expect(TREINO_CASA.length).toBeGreaterThanOrEqual(100)
    for (const c of CATEGORIAS_CASA) {
      expect(TREINO_CASA.filter((e) => e.categoria === c).length, c).toBeGreaterThanOrEqual(10)
    }
  })

  it('nomes não se repetem e cada exercício tem passos suficientes', () => {
    const nomes = TREINO_CASA.map((e) => e.nome.toLowerCase())
    expect(new Set(nomes).size).toBe(nomes.length)
    for (const e of TREINO_CASA) expect(e.passoAPasso.length, e.nome).toBeGreaterThanOrEqual(3)
  })

  it('nenhum exercício está marcado como rascunho/exemplo', () => {
    expect(TREINO_CASA.filter((e) => e.exemplo)).toEqual([])
  })

  it('sem promessa de saúde ou de resultado garantido', () => {
    const proibidas = /garantid|milagr|cura\b|curar|emagrec|perder peso|queima de gordura|resultado certo|sem esforço/i
    for (const e of TREINO_CASA) {
      const texto = [e.nome, e.objetivo, e.tempo, e.material, ...e.passoAPasso, e.variacaoFacil, e.variacaoDificil, e.erroComum ?? '', ...(e.pontosAtencao ?? [])].join(' ')
      expect(texto, e.nome).not.toMatch(proibidas)
    }
  })

  it('material pede o mínimo: nada de equipamento de academia', () => {
    const academia = /halter|barra |anilha|esteira|bicicleta ergom|kettlebell|máquina|aparelho/i
    for (const e of TREINO_CASA) expect(e.material, e.nome).not.toMatch(academia)
  })

  it('o arquivo explica como adicionar exercícios e pede revisão profissional', () => {
    const texto = readFileSync(join(RAIZ, 'src', 'data', 'treinoCasa.ts'), 'utf8')
    expect(texto).toMatch(/COMO ADICIONAR EXERCÍCIOS/)
    expect(texto).toMatch(/revisão de um profissional/)
  })
})

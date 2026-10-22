/**
 * Gera docs/animacoes-revisao.md a partir de src/data/animacoes*.ts e das cenas em public/gem/diagramas.
 * Uso: npx vite-node scripts/relatorio-animacoes.ts
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { ANIMACOES, SEM_ANIMACAO } from '../src/data/animacoes'

const RAIZ = join(__dirname, '..')
const html = readFileSync(join(RAIZ, 'index.html'), 'utf8')
const m = /^const EX = (\[.*\]);\s*$/m.exec(html)
if (!m) throw new Error('lista de exercícios não encontrada')
const nomes = new Map<number, string>((JSON.parse(m[1]) as Array<{ numero: number; nome: string }>).map((e) => [e.numero, e.nome]))

const semLigacao: Array<[number, number]> = []
for (let n = 1; n <= 240; n++) {
  const cena = JSON.parse(readFileSync(join(RAIZ, 'public', 'gem', 'diagramas', `${String(n).padStart(3, '0')}.json`), 'utf8')) as { el: Array<{ k: string; de?: string }> }
  const k = cena.el.filter((e) => e.k === 'ponta' && !e.de).length
  if (k) semLigacao.push([n, k])
}

const animados = Object.keys(ANIMACOES).map(Number).sort((a, b) => a - b)
const revisar = animados.filter((n) => ANIMACOES[n].revisar)
const sem = Object.keys(SEM_ANIMACAO).map(Number).sort((a, b) => a - b)
const afetados = semLigacao.map(([n, k]) => `${n} (${k})`).join(', ')
const total = semLigacao.reduce((s, [, k]) => s + k, 0)

const md = `# Relatório das animações dos diagramas

Gerado por \`scripts/relatorio-animacoes.ts\` (não editar à mão; edite os dados em \`src/data/animacoesLotes/\`).

## Resumo

- Exercícios animados: **${animados.length}** de 240 (os 5 primeiros, aprovados, mais ${animados.length - 5} novos).
- Marcados como "revisar": **${revisar.length}**.
- Sem animação (continuam com o diagrama estático): **${sem.length}**.
- Pontas de seta sem ligação à seta de origem após a melhora da extração: **${total}**, em ${semLigacao.length} exercícios.

## Marcados como "revisar"

| Nº | Exercício | Motivo |
|---|---|---|
${revisar.map((n) => `| ${n} | ${nomes.get(n)} | ${ANIMACOES[n].revisar} |`).join('\n')}

## Sem animação

| Nº | Exercício | Motivo |
|---|---|---|
${sem.map((n) => `| ${n} | ${nomes.get(n)} | ${SEM_ANIMACAO[n]} |`).join('\n')}

## Exercícios afetados por pontas de seta sem ligação

Cada ponta sem ligação é uma cabeça de seta que a extração não conseguiu associar a nenhuma seta (a seta em si continua no desenho; só a cabeça não aparece junto na animação). Exercício (quantidade): ${afetados}.

Nos que não estão em "revisar" a cabeça faltante é só um detalhe visual; não foi conferida exercício a exercício.
`
writeFileSync(join(RAIZ, 'docs', 'animacoes-revisao.md'), md, 'utf8')
console.log('ok', animados.length, revisar.length, sem.length, total)

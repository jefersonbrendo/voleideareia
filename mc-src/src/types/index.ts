export type Nivel = 'iniciante' | 'intermediario' | 'avancado'

export type CategoriaJogo =
  | 'Disputa'
  | 'Jogo condicionado'
  | 'Side-out e transição'
  | 'Saque e recepção'
  | 'Defesa'
  | 'Rodízio de duplas'

export interface Jogo {
  id: string
  nome: string
  categoria: CategoriaJogo
  jogadores: string
  objetivo: string
  comoFunciona: string[]
  regraPontuacao: string
  variacoes: { nivel: Nivel; descricao: string }[]
  pontosPorSet: 21 | 15 | 11
  nomesDuplas?: [string, string]
  diagrama?: 'padrao' | 'trio' | 'linha' | 'saque'
}

// ── Placar ───────────────────────────────────────────────────────────────────

export type FormatoBo = 'bo1' | 'bo3'

export interface ConfigPartida {
  pontosPorSet: 21 | 15 | 11
  formato: FormatoBo
  nomeDuplaA: string
  nomeDuplaB: string
  jogoId?: string
  jogoNome?: string
}

export interface SetResult {
  pontosA: number
  pontosB: number
  vencedor: 'A' | 'B'
}

export interface EstadoPartida {
  config: ConfigPartida
  setAtual: number
  pontosA: number
  pontosB: number
  setsA: number
  setsB: number
  resultadosSets: SetResult[]
  historico: Array<{ dupla: 'A' | 'B'; descricao: string }>
  ladoInvertido: boolean
  encerrada: boolean
  vencedora?: 'A' | 'B'
  iniciadaEm: number
}

export interface PartidaHistorico {
  id: string
  config: ConfigPartida
  resultadosSets: SetResult[]
  vencedora: 'A' | 'B'
  encerradaEm: number
}

// ── Exercício ────────────────────────────────────────────────────────────────

export interface Exercicio {
  numero: number
  secao: number
  nome: string
  nivel: string
  jogadores: string
  tempo: string
  material: string
  objetivo: string
  comoMontar: string
  passoAPasso: string[]
  pontosAtencao: string[]
  erroComum: string
  variacaoFacil: string
  variacaoDificil: string
  paraTurma: string
  meta: string
  descricaoDiagrama: string
  codigo: string
}

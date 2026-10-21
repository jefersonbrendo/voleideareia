/**
 * Order bumps do Código da Areia. A navegação, as rotas e o desbloqueio leem SÓ este arquivo.
 *
 * Senhas: aqui ficam apenas os hashes SHA-256. Para gerar o hash de uma senha:
 *   npm run gerar-hash -- SENHA
 * `hashes` aceita vários: para trocar a senha no futuro, acrescente o hash novo (e, se quiser,
 * remova o antigo). Quem já desbloqueou continua com acesso, pois o aparelho guarda o desbloqueio.
 */
export interface ModuloConfig {
  id: string
  nome: string
  /** Nome curto para o card da tela inicial. */
  nomeCurto: string
  descricao: string
  /** Conteúdo interno de um <svg viewBox="0 0 24 24"> (traço, sem preenchimento). */
  icone: string
  /** Classe de cor das seções do app (g-prep, g-fund, g-jogo, g-solo). */
  cor: string
  /** Rota de entrada do módulo (hash do app, sem o #). */
  rota: string
  /** Todas as rotas que pertencem ao módulo (nomes de rota do app). */
  rotas: readonly string[]
  preco: string
  checkoutUrl: string
  hashes: readonly string[]
  /** 2 ou 3 itens visíveis na tela do módulo bloqueado. */
  exemplos: readonly string[]
}

export const MODULOS: readonly ModuloConfig[] = [
  {
    id: 'competicao',
    nome: 'Exercícios de Competição + Placar Inteligente',
    nomeCurto: 'Competição + Placar',
    descricao:
      'Jogos prontos para seus alunos disputarem no final da aula, com placar que conta os sets e avisa a troca de lado.',
    icone:
      '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>',
    cor: 'g-solo',
    rota: 'competicao',
    rotas: ['competicao', 'jogo-comp', 'placar'],
    preco: 'R$ 4,90',
    checkoutUrl: 'https://pay.lowify.com.br/checkout?product_id=HCGTod',
    hashes: ['2f1b0f1de384483b79979d05f66f03bb2ac106f92fba20f32faba2da508d4a43'],
    exemplos: [
      'Rei da Quadra: a dupla que ganha fica na quadra e soma pontos',
      'Ponto na Diagonal: o ataque na diagonal vale mais pontos',
      'Placar inteligente: conta os sets e avisa a hora de trocar de lado',
    ],
  },
  {
    id: 'treino_casa',
    nome: 'Treino em Casa para Alunos',
    nomeCurto: 'Treino em Casa',
    descricao:
      'Passe treino para seus alunos fazerem em casa sem precisar montar nada: mais de 100 exercícios prontos para enviar.',
    icone: '<path d="M3 9.5 12 3l9 6.5V21a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/><polyline points="9 22 9 13 15 13 15 22"/>',
    cor: 'g-jogo',
    rota: 'casa',
    rotas: ['casa', 'casa-ex'],
    preco: 'R$ 6,90',
    checkoutUrl: 'https://pay.lowify.com.br/checkout?product_id=54Y0PI',
    hashes: ['48482c05a35d7160c4cd3bc7301a0d6b616a6a7eb91ff7437a17a8b330e118ec'],
    exemplos: [
      'Exercícios com bola na parede, sem precisar de rede',
      'Impulsão e força só com o peso do corpo',
      'Agilidade e mobilidade para fazer na sala de casa',
    ],
  },
]

/** Parâmetro de URL que desbloqueia por link: /?desbloquear=SENHA */
export const PARAMETRO_DESBLOQUEIO = 'desbloquear'

/** Quem abre /modo-competicao (link antigo de quem já comprou) ganha este módulo. */
export const ROTA_LEGADA = '/modo-competicao'
export const MODULO_DA_ROTA_LEGADA = 'competicao'

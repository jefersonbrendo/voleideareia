/**
 * TREINO EM CASA PARA ALUNOS: dados da seção.
 *
 * ATENÇÃO: os 3 exercícios abaixo são só EXEMPLOS (`exemplo: true`) para testar o layout.
 * Todo exercício deste arquivo precisa de revisão de um profissional de educação física antes
 * da publicação. Não escreva promessa de saúde ou de resultado físico garantido.
 *
 * COMO ADICIONAR EXERCÍCIOS
 * 1. Copie um objeto do array TREINO_CASA e cole no fim da lista (antes do `]`).
 * 2. Dê um `numero` novo, único (continue a sequência: 4, 5, 6...). O número vira o endereço
 *    do exercício (#casa-ex-4), então não reaproveite nem mude números já publicados.
 * 3. `categoria` precisa ser uma destas: 'Com bola', 'Impulsão', 'Força', 'Agilidade', 'Mobilidade'.
 * 4. `nivel`: 'Iniciante', 'Intermediário' ou 'Avançado'.
 * 5. Preencha os campos obrigatórios (todos, exceto `pontosAtencao`, `erroComum` e `exemplo`):
 *      nome, objetivo, tempo (séries/tempo), material, passoAPasso (lista de passos),
 *      variacaoFacil e variacaoDificil.
 * 6. Apague a linha `exemplo: true` nos exercícios reais. Ela mostra a etiqueta "Exemplo" no app.
 * 7. Rode `npm test`: o teste confere números repetidos, categorias e campos vazios.
 */

export const CATEGORIAS_CASA = ['Com bola', 'Impulsão', 'Força', 'Agilidade', 'Mobilidade'] as const
export type CategoriaCasa = (typeof CATEGORIAS_CASA)[number]

export const NIVEIS_CASA = ['Iniciante', 'Intermediário', 'Avançado'] as const
export type NivelCasa = (typeof NIVEIS_CASA)[number]

export interface ExercicioCasa {
  /** Único e fixo: vira o endereço do exercício (#casa-ex-<numero>). */
  numero: number
  categoria: CategoriaCasa
  nome: string
  nivel: NivelCasa
  /** Séries ou tempo, ex.: "3 séries de 10 repetições" ou "4 rodadas de 30 segundos". */
  tempo: string
  /** O mínimo possível: bola, parede, cadeira, peso do corpo. */
  material: string
  objetivo: string
  passoAPasso: string[]
  pontosAtencao?: string[]
  erroComum?: string
  variacaoFacil: string
  variacaoDificil: string
  /** Remova nos exercícios reais. */
  exemplo?: true
}

export const TREINO_CASA: ExercicioCasa[] = [
  {
    numero: 1,
    categoria: 'Com bola',
    nome: 'Toque na parede',
    nivel: 'Iniciante',
    tempo: '3 séries de 20 toques',
    material: 'Bola e uma parede livre',
    objetivo: 'Treinar o toque por cima com controle de altura e de direção, sem precisar de parceiro.',
    passoAPasso: [
      'Fique a cerca de 1 metro da parede, com os joelhos levemente flexionados.',
      'Segure a bola acima da testa e dê um toque suave para a parede, na altura dos olhos.',
      'Receba a bola de volta com as mãos em formato de triângulo e toque de novo.',
      'Conte os toques seguidos. Se a bola cair, recomece a contagem.',
    ],
    pontosAtencao: [
      'Use as pontas dos dedos, sem empurrar a bola com a palma.',
      'Estenda as pernas junto com os braços a cada toque.',
    ],
    erroComum: 'Bater na bola com os braços rígidos: ela volta sem controle. Flexione os joelhos e acompanhe a bola.',
    variacaoFacil: 'Chegue mais perto da parede e faça toques mais baixos.',
    variacaoDificil: 'Afaste-se 2 metros e alterne um toque por cima com uma manchete.',
    exemplo: true,
  },
  {
    numero: 2,
    categoria: 'Impulsão',
    nome: 'Agachamento com salto',
    nivel: 'Intermediário',
    tempo: '3 séries de 8 saltos',
    material: 'Peso do corpo',
    objetivo: 'Treinar a saída do chão para o salto, com aterrissagem controlada.',
    passoAPasso: [
      'Fique de pé com os pés na largura dos ombros.',
      'Agache até onde se sentir confortável, mantendo o peito aberto.',
      'Estenda as pernas com força e salte, levando os braços para cima.',
      'Aterrisse devagar, dobrando os joelhos para amortecer, e volte ao agachamento.',
    ],
    pontosAtencao: [
      'Aterrisse com a ponta dos pés e depois todo o pé, sem fazer barulho.',
      'Mantenha os joelhos apontando na mesma direção dos pés.',
    ],
    erroComum: 'Aterrissar com as pernas esticadas. Dobre os joelhos ao tocar o chão.',
    variacaoFacil: 'Faça o agachamento sem saltar, subindo na ponta dos pés.',
    variacaoDificil: 'Salte e, no ar, junte os joelhos ao peito antes de aterrissar.',
    exemplo: true,
  },
  {
    numero: 3,
    categoria: 'Agilidade',
    nome: 'Deslocamento lateral entre dois pontos',
    nivel: 'Iniciante',
    tempo: '4 rodadas de 30 segundos',
    material: 'Dois objetos no chão (chinelos ou garrafas)',
    objetivo: 'Treinar o deslocamento lateral curto, base do movimento de defesa.',
    passoAPasso: [
      'Marque dois pontos a 3 passos de distância um do outro.',
      'Fique ao lado de um deles, com os joelhos flexionados e o peso na frente dos pés.',
      'Desloque-se de lado até o outro ponto, sem cruzar os pés, e toque o chão com a mão.',
      'Volte pelo mesmo caminho. Repita durante os 30 segundos e descanse 30 segundos entre as rodadas.',
    ],
    pontosAtencao: ['Mantenha o quadril baixo durante todo o deslocamento.', 'Olhe para a frente, não para os pés.'],
    erroComum: 'Cruzar os pés e perder o equilíbrio. Faça passos laterais curtos.',
    variacaoFacil: 'Aproxime os dois pontos e reduza a rodada para 20 segundos.',
    variacaoDificil: 'Afaste os pontos e, ao chegar a cada um, faça um toque de bola para cima antes de voltar.',
    exemplo: true,
  },
]

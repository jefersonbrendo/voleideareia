import type { ExercicioCasa } from '../data/treinoCasa'

/** Texto simples para mandar pelo WhatsApp (*negrito* é a marcação do próprio WhatsApp). */
export function textoParaCompartilhar(ex: ExercicioCasa): string {
  const linhas = [
    `*${ex.nome}*`,
    `${ex.categoria} · ${ex.nivel}`,
    '',
    `Objetivo: ${ex.objetivo}`,
    `Material: ${ex.material}`,
    `Séries/tempo: ${ex.tempo}`,
    '',
    'Como fazer:',
    ...ex.passoAPasso.map((p, i) => `${i + 1}. ${p}`),
    '',
    `Mais fácil: ${ex.variacaoFacil}`,
    `Mais difícil: ${ex.variacaoDificil}`,
  ]
  if (ex.pontosAtencao?.length) {
    linhas.push('', 'Atenção:', ...ex.pontosAtencao.map((p) => `- ${p}`))
  }
  linhas.push('', 'Treino em Casa · Código da Areia')
  return linhas.join('\n')
}

export type ResultadoCompartilhar = 'compartilhado' | 'copiado' | 'cancelado' | 'falhou'

interface Ambiente {
  share?: (dados: { title?: string; text?: string }) => Promise<void>
  copiar?: (texto: string) => Promise<void>
}

/** navigator.share quando existir; senão copia o texto. */
export async function compartilharExercicio(ex: ExercicioCasa, ambiente: Ambiente = ambienteDoNavegador()): Promise<ResultadoCompartilhar> {
  const text = textoParaCompartilhar(ex)
  if (ambiente.share) {
    try {
      await ambiente.share({ title: ex.nome, text })
      return 'compartilhado'
    } catch (erro) {
      // Fechar a folha de compartilhamento não é erro.
      if (erro instanceof Error && erro.name === 'AbortError') return 'cancelado'
    }
  }
  if (ambiente.copiar) {
    try {
      await ambiente.copiar(text)
      return 'copiado'
    } catch {
      return 'falhou'
    }
  }
  return 'falhou'
}

function ambienteDoNavegador(): Ambiente {
  const nav = typeof navigator === 'undefined' ? undefined : navigator
  return {
    share: nav && typeof nav.share === 'function' ? (d) => nav.share(d) : undefined,
    copiar: nav?.clipboard?.writeText ? (t) => nav.clipboard.writeText(t) : undefined,
  }
}

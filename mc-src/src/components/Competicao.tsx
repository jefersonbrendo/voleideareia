import { useState, type FC } from 'react'
import type { Jogo, ConfigPartida } from '../types'
import { JOGOS, CATEGORIAS_JOGO } from '../data/jogosCompeticao'
import JogoDetalhe from './JogoDetalhe'

interface Props {
  onUsarNoPlacar: (config: ConfigPartida) => void
}

const CAT_COLORS: Record<string, string> = {
  'Disputa':              'bg-blue-50 text-blue-700',
  'Jogo condicionado':    'bg-purple-50 text-purple-700',
  'Side-out e transição': 'bg-teal-50 text-teal-700',
  'Saque e recepção':     'bg-orange-50 text-orange-700',
  'Defesa':               'bg-red-50 text-red-700',
  'Rodízio de duplas':    'bg-green-50 text-green-700',
}

const Competicao: FC<Props> = ({ onUsarNoPlacar }) => {
  const [filtro, setFiltro] = useState<string | null>(null)
  const [selecionado, setSelecionado] = useState<Jogo | null>(null)

  if (selecionado) {
    return (
      <JogoDetalhe
        jogo={selecionado}
        onVoltar={() => setSelecionado(null)}
        onUsarNoPlacar={onUsarNoPlacar}
      />
    )
  }

  const jogos = filtro ? JOGOS.filter(j => j.categoria === filtro) : JOGOS

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-gray-100 flex-shrink-0">
        <h1 className="font-display text-navy text-3xl tracking-wide leading-none">Competição</h1>
        <p className="text-gray-400 text-xs mt-0.5">{JOGOS.length} jogos competitivos</p>
      </div>

      {/* Category filters */}
      <div className="flex gap-2 px-4 py-2.5 overflow-x-auto flex-shrink-0 border-b border-gray-100 scrollbar-none">
        <button
          onClick={() => setFiltro(null)}
          className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
            !filtro ? 'bg-navy text-white' : 'bg-gray-100 text-gray-600'
          }`}
        >
          Todos
        </button>
        {CATEGORIAS_JOGO.map(cat => (
          <button
            key={cat}
            onClick={() => setFiltro(filtro === cat ? null : cat)}
            className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
              filtro === cat ? 'bg-navy text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {jogos.map(jogo => (
          <button
            key={jogo.id}
            onClick={() => setSelecionado(jogo)}
            className="w-full flex items-start gap-3 px-4 py-3.5 border-b border-gray-100 active:bg-gray-50 text-left"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-sm font-semibold text-gray-900">{jogo.nome}</p>
              </div>
              <p className="text-xs text-gray-500 line-clamp-2">{jogo.objetivo}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${CAT_COLORS[jogo.categoria] ?? 'bg-gray-100 text-gray-600'}`}>
                  {jogo.categoria}
                </span>
                <span className="text-[10px] text-gray-400">👥 {jogo.jogadores} · {jogo.pontosPorSet} pts</span>
              </div>
            </div>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-gray-300 flex-shrink-0 mt-1">
              <path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        ))}
        <div className="h-20" />
      </div>
    </div>
  )
}

export default Competicao

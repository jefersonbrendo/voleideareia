import { useState, type FC } from 'react'
import type { Exercicio } from '../types'
import ExDetalhe from './ExDetalhe'

interface Props {
  exercicios: Exercicio[]
}

function nivelClass(nivel: string) {
  const n = nivel.toLowerCase()
  if (n.includes('inic')) return 'badge-ini'
  if (n.includes('avan')) return 'badge-adv'
  return 'badge-inter'
}

const Buscar: FC<Props> = ({ exercicios }) => {
  const [query, setQuery] = useState('')
  const [selecionado, setSelecionado] = useState<Exercicio | null>(null)

  if (selecionado) {
    return <ExDetalhe ex={selecionado} onVoltar={() => setSelecionado(null)} />
  }

  const q = query.trim().toLowerCase()
  const resultados = q.length < 2
    ? []
    : exercicios.filter(e =>
        e.nome.toLowerCase().includes(q) ||
        e.objetivo.toLowerCase().includes(q) ||
        e.nivel.toLowerCase().includes(q) ||
        e.codigo.toLowerCase().includes(q),
      )

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      {/* Search bar */}
      <div className="px-4 pt-4 pb-3 border-b border-gray-100 flex-shrink-0">
        <div className="relative">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
               className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar exercícios..."
            className="w-full pl-9 pr-4 py-2.5 bg-gray-100 rounded-xl text-sm focus:outline-none focus:bg-gray-200 transition-colors"
            autoFocus
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {q.length < 2 && (
          <div className="flex flex-col items-center justify-center h-48 gap-2">
            <p className="text-gray-300 text-sm">Digite para buscar</p>
          </div>
        )}

        {q.length >= 2 && resultados.length === 0 && (
          <div className="flex flex-col items-center justify-center h-48 gap-2">
            <p className="text-gray-400 text-sm">Nenhum resultado para "{q}"</p>
          </div>
        )}

        {resultados.map(ex => (
          <button
            key={ex.numero}
            onClick={() => setSelecionado(ex)}
            className="w-full flex items-center gap-3 px-4 py-3 border-b border-gray-100 active:bg-gray-50 text-left"
          >
            <span className="text-gray-300 text-xs font-mono w-8 flex-shrink-0">
              {String(ex.numero).padStart(3, '0')}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{ex.nome}</p>
              <p className="text-xs text-gray-400 truncate mt-0.5">{ex.objetivo}</p>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${nivelClass(ex.nivel)}`}>
              {ex.nivel.charAt(0).toUpperCase()}
            </span>
          </button>
        ))}

        <div className="h-20" />
      </div>
    </div>
  )
}

export default Buscar

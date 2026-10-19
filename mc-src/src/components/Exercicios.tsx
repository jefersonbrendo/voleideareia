import { useState, type FC } from 'react'
import type { Exercicio } from '../types'
import ExDetalhe from './ExDetalhe'

interface Props {
  exercicios: Exercicio[]
}

const SECOES = [
  { id: 1, nome: 'Aquecimento e Mobilidade' },
  { id: 2, nome: 'Técnica de Base' },
  { id: 3, nome: 'Saque' },
  { id: 4, nome: 'Recepção' },
  { id: 5, nome: 'Levantamento' },
  { id: 6, nome: 'Ataque' },
  { id: 7, nome: 'Bloqueio e Defesa' },
  { id: 8, nome: 'Combinações Táticas' },
]

function nivelClass(nivel: string) {
  const n = nivel.toLowerCase()
  if (n.includes('inic')) return 'badge-ini'
  if (n.includes('avan')) return 'badge-adv'
  return 'badge-inter'
}

const Exercicios: FC<Props> = ({ exercicios }) => {
  const [selecionado, setSelecionado] = useState<Exercicio | null>(null)

  if (selecionado) {
    return <ExDetalhe ex={selecionado} onVoltar={() => setSelecionado(null)} />
  }

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-gray-100 flex-shrink-0">
        <h1 className="font-display text-navy text-3xl tracking-wide leading-none">Código da Areia</h1>
        <p className="text-gray-400 text-xs mt-0.5">Modo Competição · {exercicios.length} exercícios</p>
      </div>

      {/* Sections */}
      <div className="flex-1 overflow-y-auto">
        {SECOES.map(sec => {
          const exs = exercicios.filter(e => e.secao === sec.id)
          if (!exs.length) return null
          return (
            <div key={sec.id}>
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{sec.nome}</p>
              </div>
              {exs.map(ex => (
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
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-gray-300 flex-shrink-0">
                    <path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              ))}
            </div>
          )
        })}
        <div className="h-20" />
      </div>
    </div>
  )
}

export default Exercicios

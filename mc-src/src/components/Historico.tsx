import type { FC } from 'react'
import type { PartidaHistorico } from '../types'

interface Props {
  historico: PartidaHistorico[]
  onLimpar: () => void
  onVoltar: () => void
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
  })
}

const Historico: FC<Props> = ({ historico, onLimpar, onVoltar }) => (
  <div className="flex flex-col h-full bg-white overflow-hidden">
    <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 flex-shrink-0">
      <button onClick={onVoltar} className="p-1 -ml-1 text-gray-400">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
          <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      <h2 className="font-bold text-gray-900 flex-1">Histórico de Partidas</h2>
      {historico.length > 0 && (
        <button onClick={onLimpar} className="text-xs text-red-400 font-medium">Limpar</button>
      )}
    </div>

    <div className="flex-1 overflow-y-auto">
      {historico.length === 0 && (
        <div className="flex flex-col items-center justify-center h-48 gap-2">
          <p className="text-gray-300 text-sm">Nenhuma partida registrada</p>
        </div>
      )}

      {historico.map(p => {
        const vNome = p.vencedora === 'A' ? p.config.nomeDuplaA : p.config.nomeDuplaB
        return (
          <div key={p.id} className="px-4 py-3.5 border-b border-gray-100">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-semibold text-gray-900">
                {p.config.nomeDuplaA} × {p.config.nomeDuplaB}
              </p>
              <p className="text-[10px] text-gray-400">{formatDate(p.encerradaEm)}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-accent">{vNome} venceu</span>
              <span className="text-gray-300">·</span>
              <div className="flex gap-1.5">
                {p.resultadosSets.map((s, i) => (
                  <span key={i} className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                    {s.pontosA}–{s.pontosB}
                  </span>
                ))}
              </div>
            </div>
            {p.config.jogoNome && (
              <p className="text-[10px] text-gray-400 mt-0.5">{p.config.jogoNome}</p>
            )}
          </div>
        )
      })}

      <div className="h-20" />
    </div>
  </div>
)

export default Historico

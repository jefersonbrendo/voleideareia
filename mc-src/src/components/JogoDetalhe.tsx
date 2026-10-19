import type { FC } from 'react'
import type { Jogo, ConfigPartida } from '../types'

interface Props {
  jogo: Jogo
  onVoltar: () => void
  onUsarNoPlacar: (config: ConfigPartida) => void
}

const NIVEL_LABELS: Record<string, string> = {
  iniciante:     'Iniciante',
  intermediario: 'Intermediário',
  avancado:      'Avançado',
}
const NIVEL_CLASS: Record<string, string> = {
  iniciante:     'badge-ini',
  intermediario: 'badge-inter',
  avancado:      'badge-adv',
}

const JogoDetalhe: FC<Props> = ({ jogo, onVoltar, onUsarNoPlacar }) => {
  const handleUsarNoPlacar = () => {
    const config: ConfigPartida = {
      pontosPorSet: jogo.pontosPorSet,
      formato: 'bo1',
      nomeDuplaA: jogo.nomesDuplas?.[0] ?? 'Dupla A',
      nomeDuplaB: jogo.nomesDuplas?.[1] ?? 'Dupla B',
      jogoId: jogo.id,
      jogoNome: jogo.nome,
    }
    onUsarNoPlacar(config)
  }

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 flex-shrink-0">
        <button onClick={onVoltar} className="p-1 -ml-1 text-gray-400 active:text-gray-600">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
            <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-400">{jogo.categoria}</p>
          <h2 className="text-sm font-bold text-gray-900">{jogo.nome}</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-4 pt-4 pb-2">
          <div className="flex gap-2 flex-wrap mb-4">
            <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">👥 {jogo.jogadores}</span>
            <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">🏐 {jogo.pontosPorSet} pts por set</span>
          </div>

          <Section title="Objetivo">
            <p className="text-sm text-gray-700">{jogo.objetivo}</p>
          </Section>

          <Section title="Como funciona">
            <ol className="space-y-2">
              {jogo.comoFunciona.map((passo, i) => (
                <li key={i} className="flex gap-2 text-sm text-gray-700">
                  <span className="text-accent font-bold flex-shrink-0">{i + 1}.</span>
                  <span>{passo}</span>
                </li>
              ))}
            </ol>
          </Section>

          <Section title="Regra de pontuação">
            <p className="text-sm text-gray-700 bg-gold/10 rounded-lg px-3 py-2">{jogo.regraPontuacao}</p>
          </Section>

          <Section title="Variações por nível">
            <div className="space-y-3">
              {jogo.variacoes.map((v, i) => (
                <div key={i}>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${NIVEL_CLASS[v.nivel] ?? 'bg-gray-100 text-gray-600'}`}>
                    {NIVEL_LABELS[v.nivel] ?? v.nivel}
                  </span>
                  <p className="text-sm text-gray-700 mt-1">{v.descricao}</p>
                </div>
              ))}
            </div>
          </Section>
        </div>

        <div className="h-28" />
      </div>

      {/* CTA */}
      <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 pt-3 bg-white border-t border-gray-100"
           style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}>
        <button
          onClick={handleUsarNoPlacar}
          className="w-full bg-navy text-white font-bold py-4 rounded-2xl text-sm active:opacity-80 flex items-center justify-center gap-2"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
            <line x1="18" y1="20" x2="18" y2="10"/>
            <line x1="12" y1="20" x2="12" y2="4"/>
            <line x1="6" y1="20" x2="6" y2="14"/>
          </svg>
          Usar no Placar
        </button>
      </div>
    </div>
  )
}

const Section: FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="mb-5">
    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">{title}</p>
    {children}
  </div>
)

export default JogoDetalhe

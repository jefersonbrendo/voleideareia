import { useState, type FC } from 'react'
import type { ConfigPartida, EstadoPartida } from './types'
import type { Modulo } from './config/acessos'
import { getModulos } from './config/acessos'
import BottomNav from './components/BottomNav'
import Exercicios from './components/Exercicios'
import Buscar from './components/Buscar'
import Competicao from './components/Competicao'
import Placar from './components/Placar'
import Historico from './components/Historico'
import { useHistorico } from './hooks/useHistorico'
import exerciciosData from './data/exercicios.json'
import type { Exercicio } from './types'

const EXERCICIOS = exerciciosData as Exercicio[]
const MODULOS = getModulos('modo-competicao')

const App: FC = () => {
  const [aba, setAba] = useState<Modulo>('exercicios')
  const [configPlacar, setConfigPlacar] = useState<ConfigPartida | null>(null)
  const [showHistorico, setShowHistorico] = useState(false)
  const { historico, registrar, limpar } = useHistorico()

  const handlePartidaEncerrada = (estado: EstadoPartida) => {
    registrar(estado)
  }

  const handleUsarNoPlacar = (config: ConfigPartida) => {
    setConfigPlacar(config)
    setAba('placar')
  }

  // Placar tab has a special dark-background style — no white wrapper needed
  const isPlacarFullscreen = aba === 'placar'

  if (showHistorico) {
    return (
      <div className="h-full overflow-hidden">
        <Historico
          historico={historico}
          onLimpar={limpar}
          onVoltar={() => setShowHistorico(false)}
        />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Main content area */}
      <div className={`flex-1 overflow-hidden ${isPlacarFullscreen ? 'bg-navy' : 'bg-white'}`}
           style={{ paddingBottom: 'calc(56px + env(safe-area-inset-bottom, 0px))' }}>
        {aba === 'exercicios' && <Exercicios exercicios={EXERCICIOS} />}
        {aba === 'buscar'     && <Buscar exercicios={EXERCICIOS} />}
        {aba === 'competicao' && <Competicao onUsarNoPlacar={handleUsarNoPlacar} />}
        {aba === 'placar'     && (
          <div className="h-full flex flex-col">
            <Placar
              configInicial={configPlacar}
              onPartidaEncerrada={handlePartidaEncerrada}
              onClearConfig={() => setConfigPlacar(null)}
            />
            {/* Histórico link */}
            {historico.length > 0 && (
              <button
                onClick={() => setShowHistorico(true)}
                className="absolute top-3 right-14 text-white/30 text-xs flex items-center gap-1"
                style={{ zIndex: 10 }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                Histórico
              </button>
            )}
          </div>
        )}
      </div>

      {/* Bottom navigation */}
      <BottomNav modulos={MODULOS} ativo={aba} onChange={setAba} />
    </div>
  )
}

export default App

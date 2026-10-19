import { useEffect, useRef, useState, type FC } from 'react'
import type { ConfigPartida, EstadoPartida } from '../types'
import useScoreboard, { formatoBo, sideChangeThreshold } from '../hooks/useScoreboard'

interface Props {
  configInicial?: ConfigPartida | null
  onPartidaEncerrada: (estado: EstadoPartida) => void
  onClearConfig: () => void
}

function useWakeLock(active: boolean) {
  const lockRef = useRef<WakeLockSentinel | null>(null)
  useEffect(() => {
    if (!active) return
    if (!('wakeLock' in navigator)) return
    ;(navigator as Navigator & { wakeLock: { request: (t: string) => Promise<WakeLockSentinel> } })
      .wakeLock.request('screen').then(l => { lockRef.current = l }).catch(() => {})
    return () => { lockRef.current?.release().catch(() => {}) }
  }, [active])
}

const PONTOS_OPTS = [21, 15, 11] as const

interface ConfigModalProps {
  inicial?: ConfigPartida
  onConfirm: (c: ConfigPartida) => void
  onCancel?: () => void
}

const ConfigModal: FC<ConfigModalProps> = ({ inicial, onConfirm, onCancel }) => {
  const [nomA, setNomA] = useState(inicial?.nomeDuplaA ?? 'Dupla A')
  const [nomB, setNomB] = useState(inicial?.nomeDuplaB ?? 'Dupla B')
  const [pts, setPts] = useState<21 | 15 | 11>(inicial?.pontosPorSet ?? 21)
  const [fmt, setFmt] = useState<'bo1' | 'bo3'>(inicial?.formato ?? 'bo1')

  return (
    <div className="fixed inset-0 z-50 bg-navy flex flex-col px-5" style={{ paddingTop: 'env(safe-area-inset-top, 1rem)', paddingBottom: 'env(safe-area-inset-bottom, 1rem)' }}>
      <div className="flex items-center gap-3 pt-4 mb-6">
        {onCancel && (
          <button onClick={onCancel} className="text-white/60 hover:text-white p-1 -ml-1">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
        <h2 className="font-display text-gold text-2xl tracking-wide">Nova Partida</h2>
      </div>

      <div className="flex-1 overflow-y-auto space-y-6">
        <div className="space-y-3">
          <Label>Duplas</Label>
          <input value={nomA} onChange={e => setNomA(e.target.value)} maxLength={20}
            placeholder="Dupla A"
            className="w-full bg-white/10 text-white placeholder-white/30 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:bg-white/15"/>
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10"/>
            <span className="text-white/30 text-xs">VS</span>
            <div className="h-px flex-1 bg-white/10"/>
          </div>
          <input value={nomB} onChange={e => setNomB(e.target.value)} maxLength={20}
            placeholder="Dupla B"
            className="w-full bg-white/10 text-white placeholder-white/30 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:bg-white/15"/>
        </div>

        <div>
          <Label>Pontos por set</Label>
          <div className="flex gap-2 mt-2">
            {PONTOS_OPTS.map(p => (
              <button key={p} onClick={() => setPts(p)}
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-colors ${pts === p ? 'bg-gold text-white' : 'bg-white/10 text-white/60'}`}>
                {p}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label>Formato</Label>
          <div className="flex gap-2 mt-2">
            {(['bo1', 'bo3'] as const).map(f => (
              <button key={f} onClick={() => setFmt(f)}
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-colors ${fmt === f ? 'bg-gold text-white' : 'bg-white/10 text-white/60'}`}>
                {formatoBo(f)}
              </button>
            ))}
          </div>
          {fmt === 'bo3' && (
            <p className="text-white/40 text-xs mt-2">3.º set (tie-break) vai até 15 pontos.</p>
          )}
        </div>
      </div>

      <button
        onClick={() => onConfirm({ pontosPorSet: pts, formato: fmt, nomeDuplaA: nomA || 'Dupla A', nomeDuplaB: nomB || 'Dupla B' })}
        className="mt-6 mb-4 w-full bg-gold text-white font-bold py-4 rounded-2xl text-base active:opacity-80">
        Iniciar Partida
      </button>
    </div>
  )
}

const Label: FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">{children}</p>
)

const Placar: FC<Props> = ({ configInicial, onPartidaEncerrada, onClearConfig }) => {
  const [showConfig, setShowConfig] = useState(!configInicial)
  const [confirmNova, setConfirmNova] = useState(false)

  const { estado, pedeSideChange, podeDesfazer, addPonto, desfazer, trocarLado, novaPartida, alvoAtual } =
    useScoreboard(onPartidaEncerrada)

  useEffect(() => {
    if (configInicial) {
      novaPartida(configInicial)
      setShowConfig(false)
      onClearConfig()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configInicial])

  useWakeLock(!estado.encerrada && !showConfig)

  if (showConfig) {
    return (
      <ConfigModal
        inicial={estado.config}
        onConfirm={cfg => { novaPartida(cfg); setShowConfig(false) }}
        onCancel={estado.iniciadaEm ? () => setShowConfig(false) : undefined}
      />
    )
  }

  const { config, pontosA, pontosB, setsA, setsB, resultadosSets, encerrada, vencedora, ladoInvertido, setAtual } = estado
  const dA = ladoInvertido ? config.nomeDuplaB : config.nomeDuplaA
  const dB = ladoInvertido ? config.nomeDuplaA : config.nomeDuplaB
  const pA = ladoInvertido ? pontosB : pontosA
  const pB = ladoInvertido ? pontosA : pontosB
  const addA = () => addPonto(ladoInvertido ? 'B' : 'A')
  const addB = () => addPonto(ladoInvertido ? 'A' : 'B')
  const threshold = sideChangeThreshold(config.pontosPorSet)
  const prox = threshold - ((pontosA + pontosB) % threshold)

  if (encerrada) {
    const vNome = vencedora === 'A' ? config.nomeDuplaA : config.nomeDuplaB
    return (
      <div className="flex flex-col h-full bg-navy text-white items-center justify-center px-6 gap-6">
        <div className="text-center">
          <p className="text-gold font-display text-4xl tracking-wide">Campeã</p>
          <p className="text-white text-2xl font-bold mt-1">{vNome}</p>
        </div>
        <div className="flex gap-3 text-sm text-white/50 flex-wrap justify-center">
          {resultadosSets.map((s, i) => (
            <span key={i} className="bg-white/10 px-3 py-1 rounded-full">
              Set {i + 1}: {s.pontosA}–{s.pontosB}
            </span>
          ))}
        </div>
        <button onClick={() => setShowConfig(true)}
          className="w-full bg-gold text-white font-bold py-4 rounded-2xl text-sm active:opacity-80">
          Nova Partida
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-navy overflow-hidden">
      {/* Top bar */}
      <div className="px-4 pb-2 flex items-center justify-between flex-shrink-0"
           style={{ paddingTop: 'env(safe-area-inset-top, 0.5rem)' }}>
        <div>
          {config.jogoNome && (
            <p className="text-white/40 text-[10px] uppercase tracking-widest truncate max-w-[180px]">{config.jogoNome}</p>
          )}
          <p className="text-white/70 text-xs font-medium">
            Set {setAtual} · {alvoAtual} pts · Troca a cada {threshold} pts
          </p>
        </div>
        <div className="flex items-center gap-2">
          {config.formato === 'bo3' && (
            <span className="text-white/50 text-xs bg-white/10 px-2 py-0.5 rounded-full">{setsA}–{setsB}</span>
          )}
          <button onClick={() => setConfirmNova(true)} className="text-white/40 p-1">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" strokeLinecap="round"/>
              <path d="M3 3v5h5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Score area */}
      <div className="flex flex-1 gap-px">
        <ScoreSide nome={dA} pontos={pA} cor="left" onAdd={addA} />
        <ScoreSide nome={dB} pontos={pB} cor="right" onAdd={addB} />
      </div>

      {/* Bottom info */}
      <div className="px-4 pb-2 flex items-center justify-between text-white/40 text-[10px] flex-shrink-0"
           style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom, 0px))' }}>
        <span>Próxima troca de lado em {prox} {prox === 1 ? 'pt' : 'pts'}</span>
        {podeDesfazer && (
          <button onClick={desfazer} className="flex items-center gap-1 text-gold/70">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
              <path d="M9 14L4 9l5-5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" strokeLinecap="round"/>
            </svg>
            Desfazer
          </button>
        )}
      </div>

      {/* Side-change banner */}
      {pedeSideChange && (
        <div className="fixed inset-0 z-50 bg-navy/95 flex flex-col items-center justify-center px-6 gap-5">
          <div className="w-16 h-16 rounded-full bg-gold/20 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="#E89B17" strokeWidth={2} className="w-8 h-8">
              <path d="M8 3L4 7l4 4M4 7h16M16 21l4-4-4-4M20 17H4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <p className="text-gold font-display text-3xl tracking-wide text-center">Troca de Lado</p>
          <p className="text-white/50 text-sm text-center">
            {pontosA + pontosB} pontos disputados. As duplas trocam de meia-quadra.
          </p>
          <button onClick={trocarLado}
            className="w-full bg-gold text-white font-bold py-5 rounded-2xl text-base mt-2 active:opacity-80">
            Trocar Lado ↔
          </button>
        </div>
      )}

      {/* Confirm nova partida */}
      {confirmNova && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end">
          <div className="w-full bg-white rounded-t-3xl p-6">
            <h3 className="font-semibold text-gray-900 text-base mb-1">Nova partida?</h3>
            <p className="text-gray-500 text-sm mb-5">A partida atual será encerrada e salva no histórico.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmNova(false)}
                className="flex-1 bg-gray-100 text-gray-700 font-semibold py-3.5 rounded-xl active:opacity-80">
                Cancelar
              </button>
              <button onClick={() => { setConfirmNova(false); setShowConfig(true) }}
                className="flex-1 bg-navy text-white font-semibold py-3.5 rounded-xl active:opacity-80">
                Nova Partida
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface ScoreSideProps {
  nome: string
  pontos: number
  cor: 'left' | 'right'
  onAdd: () => void
}

const ScoreSide: FC<ScoreSideProps> = ({ nome, pontos, cor, onAdd }) => (
  <button
    onClick={onAdd}
    className={`flex-1 flex flex-col items-center justify-center gap-3 select-none active:opacity-80 ${
      cor === 'left' ? 'bg-accent/20' : 'bg-ini/20'
    }`}
    aria-label={`Ponto para ${nome}`}
  >
    <p className="text-white/70 text-sm font-semibold text-center px-2 leading-tight max-w-full truncate">{nome}</p>
    <p className="font-display text-white leading-none tracking-tight" style={{ fontSize: 'clamp(72px, 18vw, 110px)' }}>{pontos}</p>
    <div className="w-12 h-12 rounded-full bg-white/15 flex items-center justify-center">
      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} className="w-6 h-6">
        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
    </div>
  </button>
)

export default Placar

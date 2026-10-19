import { useCallback, useEffect, useReducer } from 'react'
import type { ConfigPartida, EstadoPartida, FormatoBo, SetResult } from '../types'

const LS_KEY = 'mc_partida_atual'

// ── Side-change thresholds ───────────────────────────────────────────────────
export function sideChangeThreshold(pontosPorSet: 21 | 15 | 11): number {
  if (pontosPorSet === 21) return 7
  if (pontosPorSet === 15) return 5
  return 4 // 11
}

export function shouldChangeSide(
  prevA: number,
  prevB: number,
  nextA: number,
  nextB: number,
  pontosPorSet: 21 | 15 | 11,
): boolean {
  const threshold = sideChangeThreshold(pontosPorSet)
  const prevTotal = prevA + prevB
  const nextTotal = nextA + nextB
  return Math.floor(prevTotal / threshold) < Math.floor(nextTotal / threshold)
}

export function isSetOver(pontosA: number, pontosB: number, pontosAlvo: number): boolean {
  if (pontosA < pontosAlvo && pontosB < pontosAlvo) return false
  return Math.abs(pontosA - pontosB) >= 2
}

export function setAlvo(config: ConfigPartida, setAtual: number): 21 | 15 | 11 {
  if (config.formato === 'bo3' && setAtual === 3) return 15
  return config.pontosPorSet
}

function buildInitial(config: ConfigPartida): EstadoPartida {
  return {
    config,
    setAtual: 1,
    pontosA: 0,
    pontosB: 0,
    setsA: 0,
    setsB: 0,
    resultadosSets: [],
    historico: [],
    ladoInvertido: false,
    encerrada: false,
    iniciadaEm: Date.now(),
  }
}

type Action =
  | { type: 'PONTO'; dupla: 'A' | 'B' }
  | { type: 'DESFAZER' }
  | { type: 'TROCAR_LADO' }
  | { type: 'NOVA_PARTIDA'; config: ConfigPartida }
  | { type: 'LOAD'; estado: EstadoPartida }

interface State {
  atual: EstadoPartida
  pedeSideChange: boolean
  snapshotAnterior: EstadoPartida | null
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'LOAD':
      return { ...state, atual: action.estado, pedeSideChange: false, snapshotAnterior: null }

    case 'NOVA_PARTIDA':
      return { atual: buildInitial(action.config), pedeSideChange: false, snapshotAnterior: null }

    case 'TROCAR_LADO':
      return { ...state, pedeSideChange: false, atual: { ...state.atual, ladoInvertido: !state.atual.ladoInvertido } }

    case 'DESFAZER': {
      if (!state.snapshotAnterior) return state
      return { ...state, atual: state.snapshotAnterior, snapshotAnterior: null, pedeSideChange: false }
    }

    case 'PONTO': {
      const prev = state.atual
      if (prev.encerrada) return state
      const snapshot = prev
      const dupla = action.dupla
      const pA = prev.pontosA + (dupla === 'A' ? 1 : 0)
      const pB = prev.pontosB + (dupla === 'B' ? 1 : 0)
      const alvo = setAlvo(prev.config, prev.setAtual)
      const setTerminou = isSetOver(pA, pB, alvo)
      const mudaLado = !setTerminou && shouldChangeSide(prev.pontosA, prev.pontosB, pA, pB, prev.config.pontosPorSet)

      if (!setTerminou) {
        return {
          snapshotAnterior: snapshot,
          pedeSideChange: mudaLado,
          atual: {
            ...prev, pontosA: pA, pontosB: pB,
            historico: [...prev.historico, { dupla, descricao: `${dupla === 'A' ? prev.config.nomeDuplaA : prev.config.nomeDuplaB} marcou ponto (set ${prev.setAtual}: ${pA}–${pB})` }],
          },
        }
      }

      const vencedorSet: 'A' | 'B' = pA > pB ? 'A' : 'B'
      const setResult: SetResult = { pontosA: pA, pontosB: pB, vencedor: vencedorSet }
      const newSetsA = prev.setsA + (vencedorSet === 'A' ? 1 : 0)
      const newSetsB = prev.setsB + (vencedorSet === 'B' ? 1 : 0)
      const resultadosSets = [...prev.resultadosSets, setResult]
      const setsParaVencer = prev.config.formato === 'bo3' ? 2 : 1
      const partidaEncerrada = newSetsA >= setsParaVencer || newSetsB >= setsParaVencer
      const vencedoraPartida: 'A' | 'B' | undefined = newSetsA >= setsParaVencer ? 'A' : newSetsB >= setsParaVencer ? 'B' : undefined

      if (partidaEncerrada) {
        return {
          snapshotAnterior: snapshot,
          pedeSideChange: false,
          atual: { ...prev, pontosA: pA, pontosB: pB, setsA: newSetsA, setsB: newSetsB, resultadosSets, encerrada: true, vencedora: vencedoraPartida, historico: [...prev.historico, { dupla: vencedorSet, descricao: `Set ${prev.setAtual} encerrado: ${pA}–${pB}. Fim da partida.` }] },
        }
      }

      return {
        snapshotAnterior: snapshot,
        pedeSideChange: true,
        atual: { ...prev, pontosA: 0, pontosB: 0, setAtual: prev.setAtual + 1, setsA: newSetsA, setsB: newSetsB, resultadosSets, historico: [...prev.historico, { dupla: vencedorSet, descricao: `Set ${prev.setAtual} encerrado: ${pA}–${pB}` }] },
      }
    }
  }
}

export function useScoreboard(onPartidaEncerrada: (estado: EstadoPartida) => void) {
  const [state, dispatch] = useReducer(reducer, {
    atual: buildInitial({ pontosPorSet: 21, formato: 'bo1', nomeDuplaA: 'Dupla A', nomeDuplaB: 'Dupla B' }),
    pedeSideChange: false,
    snapshotAnterior: null,
  })

  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(state.atual)) } catch (_) { /* ignore */ }
  }, [state.atual])

  const encerrada = state.atual.encerrada
  useEffect(() => {
    if (encerrada) onPartidaEncerrada(state.atual)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [encerrada])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY)
      if (raw) dispatch({ type: 'LOAD', estado: JSON.parse(raw) as EstadoPartida })
    } catch (_) { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const addPonto = useCallback((dupla: 'A' | 'B') => dispatch({ type: 'PONTO', dupla }), [])
  const desfazer = useCallback(() => dispatch({ type: 'DESFAZER' }), [])
  const trocarLado = useCallback(() => dispatch({ type: 'TROCAR_LADO' }), [])
  const novaPartida = useCallback((config: ConfigPartida) => {
    try { localStorage.removeItem(LS_KEY) } catch (_) { /* ignore */ }
    dispatch({ type: 'NOVA_PARTIDA', config })
  }, [])

  return {
    estado: state.atual,
    pedeSideChange: state.pedeSideChange,
    podeDesfazer: !!state.snapshotAnterior,
    addPonto,
    desfazer,
    trocarLado,
    novaPartida,
    alvoAtual: setAlvo(state.atual.config, state.atual.setAtual),
  }
}

export default useScoreboard
export type UseScoreboardReturn = ReturnType<typeof useScoreboard>

export function formatoBo(f: FormatoBo): string {
  return f === 'bo1' ? 'Melhor de 1' : 'Melhor de 3'
}

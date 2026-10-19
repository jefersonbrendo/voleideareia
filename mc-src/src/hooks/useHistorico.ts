import { useCallback, useState } from 'react'
import type { EstadoPartida, PartidaHistorico } from '../types'

const LS_KEY = 'mc_historico'

function load(): PartidaHistorico[] {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? (JSON.parse(raw) as PartidaHistorico[]) : []
  } catch (_) {
    return []
  }
}

function save(list: PartidaHistorico[]) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(list)) } catch (_) { /* ignore */ }
}

export function useHistorico() {
  const [historico, setHistorico] = useState<PartidaHistorico[]>(() => load())

  const registrar = useCallback((estado: EstadoPartida) => {
    if (!estado.encerrada || !estado.vencedora) return
    const entrada: PartidaHistorico = {
      id: crypto.randomUUID(),
      config: estado.config,
      resultadosSets: estado.resultadosSets,
      vencedora: estado.vencedora,
      encerradaEm: Date.now(),
    }
    setHistorico(prev => {
      const next = [entrada, ...prev].slice(0, 50)
      save(next)
      return next
    })
  }, [])

  const limpar = useCallback(() => {
    save([])
    setHistorico([])
  }, [])

  return { historico, registrar, limpar }
}

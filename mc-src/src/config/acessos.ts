export type Modulo =
  | 'exercicios'
  | 'buscar'
  | 'competicao'
  | 'placar'

export interface TabConfig {
  id: Modulo
  label: string
  icon: string
}

// Maps each access route to its enabled modules (in nav order)
export const ACESSOS: Record<string, Modulo[]> = {
  principal:         ['exercicios', 'buscar'],
  'modo-competicao': ['exercicios', 'buscar', 'competicao', 'placar'],
}

export const TAB_LABELS: Record<Modulo, string> = {
  exercicios: 'Início',
  buscar:     'Buscar',
  competicao: 'Competição',
  placar:     'Placar',
}

export const TAB_ICONS: Record<Modulo, string> = {
  exercicios: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  buscar:     `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
  competicao: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg>`,
  placar:     `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
}

export function getModulos(acesso: string): Modulo[] {
  return ACESSOS[acesso] ?? ACESSOS.principal
}

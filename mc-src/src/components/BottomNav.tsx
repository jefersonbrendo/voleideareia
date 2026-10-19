import type { FC } from 'react'
import type { Modulo } from '../config/acessos'
import { TAB_LABELS } from '../config/acessos'

interface Props {
  modulos: Modulo[]
  ativo: Modulo
  onChange: (m: Modulo) => void
}

const ICONS: Record<Modulo, JSX.Element> = {
  exercicios: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  buscar: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  competicao: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
      <path d="M4 22h16"/>
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>
    </svg>
  ),
  placar: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="w-5 h-5">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
}

const BottomNav: FC<Props> = ({ modulos, ativo, onChange }) => (
  <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center z-40"
       style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)', height: 'calc(56px + env(safe-area-inset-bottom, 0px))' }}>
    {modulos.map(m => (
      <button
        key={m}
        onClick={() => onChange(m)}
        className={`flex flex-col items-center gap-0.5 flex-1 py-2 transition-colors ${
          ativo === m ? 'text-accent' : 'text-gray-400'
        }`}
        aria-label={TAB_LABELS[m]}
      >
        {ICONS[m]}
        <span className={`text-[10px] font-semibold ${ativo === m ? 'text-accent' : 'text-gray-400'}`}>
          {TAB_LABELS[m]}
        </span>
      </button>
    ))}
  </nav>
)

export default BottomNav

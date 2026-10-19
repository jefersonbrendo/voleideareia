import type { FC } from 'react'
import type { Exercicio } from '../types'

interface Props {
  ex: Exercicio
  onVoltar: () => void
}

function nivelLabel(nivel: string) {
  const n = nivel.toLowerCase()
  if (n.includes('inic')) return { label: 'Iniciante', cls: 'badge-ini' }
  if (n.includes('avan')) return { label: 'Avançado', cls: 'badge-adv' }
  return { label: 'Intermediário', cls: 'badge-inter' }
}

const ExDetalhe: FC<Props> = ({ ex, onVoltar }) => {
  const imgKey = String(ex.numero).padStart(3, '0')
  const { label, cls } = nivelLabel(ex.nivel)

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
          <p className="text-xs text-gray-400 font-mono">{ex.codigo}</p>
          <h2 className="text-sm font-bold text-gray-900 truncate">{ex.nome}</h2>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${cls}`}>{label}</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Diagram */}
        <div className="mx-4 mt-4 rounded-xl overflow-hidden bg-gray-100">
          <img
            src={`/gem/diagrams/${imgKey}.png`}
            alt={`Diagrama ${ex.nome}`}
            loading="lazy"
            className="w-full h-auto block"
            onError={e => {
              const img = e.currentTarget
              const p = document.createElement('p')
              p.textContent = ex.descricaoDiagrama || ''
              p.className = 'text-xs text-gray-500 p-3'
              img.replaceWith(p)
            }}
          />
        </div>

        <div className="px-4 pb-4 space-y-5 mt-4">
          {/* Meta info */}
          <div className="flex gap-3 flex-wrap">
            <Chip icon="👥">{ex.jogadores}</Chip>
            <Chip icon="⏱">{ex.tempo}</Chip>
          </div>

          <Section title="Objetivo">
            <p className="text-sm text-gray-700">{ex.objetivo}</p>
          </Section>

          <Section title="Como montar">
            <p className="text-sm text-gray-700">{ex.comoMontar}</p>
          </Section>

          <Section title="Passo a passo">
            <ol className="space-y-2">
              {ex.passoAPasso.map((p, i) => (
                <li key={i} className="flex gap-2 text-sm text-gray-700">
                  <span className="text-accent font-bold flex-shrink-0">{i + 1}.</span>
                  <span>{p}</span>
                </li>
              ))}
            </ol>
          </Section>

          {ex.pontosAtencao?.length > 0 && (
            <Section title="Pontos de atenção">
              <ul className="space-y-1.5">
                {ex.pontosAtencao.map((p, i) => (
                  <li key={i} className="flex gap-2 text-sm text-gray-700">
                    <span className="text-gold flex-shrink-0">•</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {ex.erroComum && (
            <Section title="Erro comum">
              <p className="text-sm text-gray-700">{ex.erroComum}</p>
            </Section>
          )}

          {(ex.variacaoFacil || ex.variacaoDificil) && (
            <Section title="Variações">
              {ex.variacaoFacil && (
                <div className="mb-2">
                  <span className="text-[10px] font-bold badge-ini px-2 py-0.5 rounded-full">Mais fácil</span>
                  <p className="text-sm text-gray-700 mt-1">{ex.variacaoFacil}</p>
                </div>
              )}
              {ex.variacaoDificil && (
                <div>
                  <span className="text-[10px] font-bold badge-adv px-2 py-0.5 rounded-full">Mais difícil</span>
                  <p className="text-sm text-gray-700 mt-1">{ex.variacaoDificil}</p>
                </div>
              )}
            </Section>
          )}

          {ex.meta && (
            <div className="bg-navy/5 rounded-xl p-3">
              <p className="text-[10px] font-bold text-navy uppercase tracking-wider mb-1">Meta</p>
              <p className="text-sm text-gray-700">{ex.meta}</p>
            </div>
          )}
        </div>

        <div className="h-20" />
      </div>
    </div>
  )
}

const Section: FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div>
    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">{title}</p>
    {children}
  </div>
)

const Chip: FC<{ icon: string; children: React.ReactNode }> = ({ icon, children }) => (
  <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
    <span>{icon}</span>
    <span>{children}</span>
  </span>
)

export default ExDetalhe

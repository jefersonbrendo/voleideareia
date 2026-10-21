import { ChipVolume } from '../components/treinoCasa/ChipVolume'
import { ICONE_MATERIAL, IconesMaterial } from '../components/treinoCasa/IconesMaterial'
import { SilhuetaRegioes } from '../components/treinoCasa/SilhuetaRegioes'
import { CATEGORIAS_CASA, TREINO_CASA, type CategoriaCasa, type ExercicioCasa, type NivelCasa } from '../data/treinoCasa'
import { compartilharExercicio } from '../lib/compartilhar'
import { ROTULO_REGIAO, ehSoCorpo } from '../lib/treinoCasaTextos'
import type { ModuloConfig } from '../config/modulos'
import { mostrarAviso } from './aviso'
import { cabecalho } from './cabecalho'
import type { Contexto } from './contexto'
import { h, svg, ICONES, ICONES_CATEGORIA } from './dom'

const CLASSE_NIVEL: Record<NivelCasa, string> = { 'Iniciante': 'ini', 'Intermediário': 'int', 'Avançado': 'ava' }
const COR_NIVEL: Record<NivelCasa, string> = { 'Iniciante': '#1E9E5A', 'Intermediário': '#E08A00', 'Avançado': '#E5352B' }

/** Filtros da lista (valem enquanto o app está aberto). Combinam entre si. */
let filtroCategoria: CategoriaCasa | '' = ''
let filtroSoCorpo = false

/** Volta os filtros ao padrão (usado nos testes). */
export function reiniciarFiltros(): void {
  filtroCategoria = ''
  filtroSoCorpo = false
}

export function rotaDoExercicio(numero: number): string {
  return `casa-${numero}`
}

/** Exercícios que passam pelo filtro "Só o corpo" (a categoria é aplicada por quem chama). */
function passaNoSoCorpo(ex: ExercicioCasa): boolean {
  return !filtroSoCorpo || ehSoCorpo(ex.material)
}

function cartaoDoExercicio(ex: ExercicioCasa, ordem: number): HTMLElement {
  const miniatura = h('figure', { cls: 'foto r-1x1 mini thumb-diag sem-img cda-thumb', html: svg(ICONES_CATEGORIA[ex.categoria] ?? '') })
  const meta = h('div', { cls: 'ex-row-meta' }, h('span', { cls: `nivel-badge nivel-${ex.nivel}` }, ex.nivel))
  // Linha compacta: ícones de material, volume e silhueta. Nunca quebra em duas linhas.
  const visual = h('div', { cls: 'cda-card-visual' },
    IconesMaterial(ex.material, { comNome: false }),
    ChipVolume(ex.volume),
    SilhuetaRegioes(ex.regioes, { altura: 32 }),
  )
  const corpo = h('div', { cls: 'ex-row-body' }, h('div', { cls: 'ex-ordem' }, `${ordem}º exercício`), h('div', { cls: 'ex-row-nome' }, ex.nome), meta, visual)
  const botao = h('button', { cls: 'ex-row', 'data-numero': ex.numero }, miniatura, corpo, h('span', { cls: 'chev', html: svg(ICONES.avancar) }))
  botao.addEventListener('click', () => { window.location.hash = `#${rotaDoExercicio(ex.numero)}` })
  return botao
}

function desenharLista(destino: HTMLElement): void {
  destino.replaceChildren()
  const categorias = CATEGORIAS_CASA.filter((c) => !filtroCategoria || c === filtroCategoria)
  let algum = false
  for (const categoria of categorias) {
    const lista = TREINO_CASA.filter((e) => e.categoria === categoria && passaNoSoCorpo(e))
    if (lista.length === 0) continue
    algum = true
    destino.append(
      h('div', { cls: 'grupo-nivel', html: `<span class="fs-dot" style="background:var(--accent)"></span>` }, `${categoria} `, h('small', null, String(lista.length))),
      h('div', { cls: 'ex-list' }, ...lista.map((e, i) => cartaoDoExercicio(e, i + 1))),
    )
  }
  if (!algum) destino.append(h('div', { cls: 'search-empty' }, 'Nenhum exercício com esses filtros ainda.'))
}

export function renderListaTreinoCasa(modulo: ModuloConfig): DocumentFragment {
  const frag = document.createDocumentFragment()
  frag.append(cabecalho({ titulo: modulo.nome, etiqueta: 'BÔNUS', detalhe: `• ${TREINO_CASA.length} exercícios`, voltarPara: 'home' }))

  const usadas = CATEGORIAS_CASA.filter((c) => TREINO_CASA.some((e) => e.categoria === c))
  const faixa = h('div', { cls: `secao-band ${modulo.cor}` },
    h('div', { cls: 'secao-band-row' },
      h('span', { cls: 'secao-band-ico', html: svg(modulo.icone) }),
      h('div', null,
        h('h2', { cls: 'secao-band-nome' }, modulo.nomeCurto),
        h('p', { cls: 'secao-band-resumo' }, `${TREINO_CASA.length} exercícios: ${usadas.join(', ')}`),
      ),
    ),
  )

  const lista = h('div', null)
  const chips = h('div', { cls: 'level-chips' })
  const contar = (categoria: CategoriaCasa | ''): number =>
    TREINO_CASA.filter((e) => (!categoria || e.categoria === categoria) && passaNoSoCorpo(e)).length

  const opcoes: Array<[CategoriaCasa | '', string]> = [['', 'Todos'], ...CATEGORIAS_CASA.map((c): [CategoriaCasa, string] => [c, c])]
  for (const [valor, rotulo] of opcoes) {
    const chip = h('button', { cls: `chip chip-all${filtroCategoria === valor ? ' active' : ''}`, 'data-val': valor, html: `${rotulo}<span class="chip-count"></span>` })
    chip.addEventListener('click', () => {
      filtroCategoria = valor
      chips.querySelectorAll('.chip').forEach((b) => b.classList.toggle('active', (b as HTMLElement).dataset.val === valor))
      desenharLista(lista)
    })
    chips.append(chip)
  }
  /** Os números dos chips acompanham o filtro "Só o corpo". */
  const atualizarContagens = (): void => {
    chips.querySelectorAll<HTMLElement>('.chip').forEach((chip) => {
      const valor = (chip.dataset.val ?? '') as CategoriaCasa | ''
      const qtd = contar(valor)
      chip.querySelector('.chip-count')!.textContent = String(qtd)
      if (valor && qtd === 0) chip.setAttribute('disabled', '')
      else chip.removeAttribute('disabled')
    })
  }

  const totalSoCorpo = TREINO_CASA.filter((e) => ehSoCorpo(e.material)).length
  const botaoSoCorpo = h('button', { cls: `chip cda-filtro-corpo${filtroSoCorpo ? ' active' : ''}`, 'data-filtro': 'so-corpo', 'aria-pressed': String(filtroSoCorpo), type: 'button' })
  botaoSoCorpo.innerHTML = `${svg(ICONE_MATERIAL.corpo)}Só o corpo<span class="chip-count">${totalSoCorpo}</span>`
  botaoSoCorpo.addEventListener('click', () => {
    filtroSoCorpo = !filtroSoCorpo
    botaoSoCorpo.classList.toggle('active', filtroSoCorpo)
    botaoSoCorpo.setAttribute('aria-pressed', String(filtroSoCorpo))
    atualizarContagens()
    desenharLista(lista)
  })

  atualizarContagens()
  desenharLista(lista)

  frag.append(h('div', { cls: 'page' },
    h('div', { cls: 'secao-intro' }, faixa, h('p', { cls: 'secao-desc' }, modulo.descricao)),
    h('div', { cls: 'cda-linha-filtro-corpo' }, botaoSoCorpo, h('span', { cls: 'cda-dica-filtro' }, 'Para quem não tem nada em casa')),
    chips, lista,
  ))
  return frag
}

/** Bloco logo abaixo do título: Material, Volume e Trabalha (silhueta + nomes das regiões). */
function blocoVisual(ex: ExercicioCasa): HTMLElement {
  const parte = (rotulo: string, ...filhos: Array<HTMLElement | null>) =>
    h('div', { cls: 'cda-visual-parte' }, h('p', { cls: 'cda-visual-rotulo' }, rotulo), ...filhos)

  const regioes = ex.regioes.map((r) => h('li', { 'data-regiao': r }, ROTULO_REGIAO[r]))
  return h('div', { cls: 'cda-visual' },
    parte('Material', IconesMaterial(ex.material, { comNome: true }), ex.materialNota ? h('p', { cls: 'cda-visual-nota' }, ex.materialNota) : null),
    parte('Volume', ChipVolume(ex.volume), ex.volumeNota ? h('p', { cls: 'cda-visual-nota' }, ex.volumeNota) : null),
    parte('Trabalha', h('div', { cls: 'cda-trabalha' }, SilhuetaRegioes(ex.regioes, { altura: 120 }), h('ul', { cls: 'cda-regioes-lista' }, ...regioes))),
  )
}

export function renderExercicioCasa(ctx: Contexto, modulo: ModuloConfig, id: string): DocumentFragment {
  const ex = TREINO_CASA.find((e) => String(e.numero) === id)
  if (!ex) { ctx.irPara(modulo.rota); return document.createDocumentFragment() }

  const frag = document.createDocumentFragment()
  const daCategoria = TREINO_CASA.filter((e) => e.categoria === ex.categoria)
  const posicao = daCategoria.findIndex((e) => e.numero === ex.numero)

  frag.append(cabecalho({ titulo: ex.nome, etiqueta: ex.categoria.toUpperCase(), corEtiqueta: COR_NIVEL[ex.nivel], detalhe: `• ${ex.nivel}`, voltarPara: modulo.rota }))

  const page = h('div', { cls: 'page ex-page' })
  page.insertAdjacentHTML('beforeend', `
    <div class="progresso">
      <div class="progresso-txt"><span></span><span>Treino em Casa</span></div>
      <div class="progresso-barra"><i style="width:${((posicao + 1) / daCategoria.length) * 100}%"></i></div>
    </div>`)
  page.querySelector('.progresso-txt span')!.textContent = `Exercício ${posicao + 1} de ${daCategoria.length} em ${ex.categoria}`

  page.append(
    h('h2', { cls: 'ex-titulo' }, ex.nome),
    h('div', { cls: 'ex-sub' }, h('span', { cls: `pill pill-${CLASSE_NIVEL[ex.nivel]}` }, ex.nivel)),
    blocoVisual(ex),
  )

  type Aba = 'fazer' | 'corrigir' | 'variar'
  const abas: Array<[Aba, string]> = [['fazer', 'Como fazer']]
  if (ex.pontosAtencao?.length || ex.erroComum) abas.push(['corrigir', 'Corrigir'])
  abas.push(['variar', 'Variações'])
  let aba: Aba = 'fazer'

  const seg = h('div', { cls: 'seg', role: 'tablist' })
  const conteudo = h('div', null)
  const bloco = (icone: string, titulo: string, ...filhos: HTMLElement[]) =>
    h('section', { cls: 'bloco' }, h('h3', { html: svg(icone) }, titulo), ...filhos)
  const caixa = (cls: string, texto: string, rotulo?: string) =>
    h('div', { cls: `caixa ${cls}` }, rotulo ? h('strong', null, rotulo) : null, texto)

  const pintar = (): void => {
    seg.querySelectorAll('button').forEach((b) => {
      const ativa = (b as HTMLElement).dataset.k === aba
      b.classList.toggle('active', ativa)
      b.setAttribute('aria-selected', String(ativa))
    })
    conteudo.replaceChildren()
    if (aba === 'fazer') {
      conteudo.append(
        bloco(ICONES.alvo, 'Objetivo', caixa('caixa-objetivo', ex.objetivo)),
        bloco(ICONES.lista, 'Passo a passo', h('ul', { cls: 'step-list' },
          ...ex.passoAPasso.map((p, i) => h('li', { cls: 'step-item' }, h('span', { cls: 'step-num' }, String(i + 1)), h('span', { cls: 'step-text' }, p))))),
      )
    } else if (aba === 'corrigir') {
      if (ex.pontosAtencao?.length) {
        conteudo.append(bloco(ICONES.alerta, 'Pontos de atenção', h('ul', { cls: 'bullet-list' },
          ...ex.pontosAtencao.map((p) => h('li', { cls: 'bullet-item' }, h('span', { cls: 'bullet-dot' }), h('span', null, p))))))
      }
      if (ex.erroComum) conteudo.append(bloco(ICONES.alerta, 'Erro mais comum', caixa('caixa-erro', ex.erroComum)))
    } else {
      conteudo.append(bloco(ICONES.camadas, 'Ajustar a dificuldade',
        caixa('caixa-facil', ex.variacaoFacil, 'Mais fácil'),
        h('div', { style: 'height:8px' }),
        caixa('caixa-dificil', ex.variacaoDificil, 'Mais difícil')))
    }
  }
  for (const [k, rotulo] of abas) {
    const b = h('button', { role: 'tab', 'data-k': k }, rotulo)
    b.addEventListener('click', () => { aba = k; pintar() })
    seg.append(b)
  }
  pintar()
  page.append(seg, conteudo)
  frag.append(page)

  const anterior = posicao > 0 ? daCategoria[posicao - 1] : null
  const proximo = posicao < daCategoria.length - 1 ? daCategoria[posicao + 1] : null
  const bAnt = h('button', { cls: 'btn-sec', 'aria-label': 'Exercício anterior', html: svg(ICONES.voltar) })
  const bProx = h('button', { cls: 'btn-sec', 'aria-label': 'Próximo exercício', html: svg(ICONES.avancar) })
  const bComp = h('button', { cls: 'btn-pri', 'data-acao': 'compartilhar', html: `${svg(ICONES.compartilhar)}Compartilhar com aluno` })
  if (anterior) bAnt.addEventListener('click', () => { window.location.hash = `#${rotaDoExercicio(anterior.numero)}` }); else bAnt.setAttribute('disabled', '')
  if (proximo) bProx.addEventListener('click', () => { window.location.hash = `#${rotaDoExercicio(proximo.numero)}` }); else bProx.setAttribute('disabled', '')
  bComp.addEventListener('click', async () => {
    const r = await compartilharExercicio(ex)
    if (r === 'copiado') mostrarAviso('Texto copiado! Cole no WhatsApp para enviar ao aluno.')
    else if (r === 'falhou') mostrarAviso('Não foi possível compartilhar. Tente de novo.')
  })
  frag.append(h('div', { cls: 'acao-bar' }, h('div', { cls: 'acao-bar-inner' }, bAnt, bComp, bProx)))
  return frag
}

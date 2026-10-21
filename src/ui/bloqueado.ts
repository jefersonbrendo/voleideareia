import type { ModuloConfig } from '../config/modulos'
import { linkSuporte } from '../config/suporte'
import { mostrarAviso } from './aviso'
import { cabecalho } from './cabecalho'
import type { Contexto } from './contexto'
import { h, svg, ICONES } from './dom'

export const MSG_SENHA_INCORRETA = 'Senha incorreta. Confira a mensagem que você recebeu depois da compra.'

/** Tela do módulo bloqueado: o que a pessoa vai receber, comprar ou digitar a senha. */
export function renderBloqueado(ctx: Contexto, modulo: ModuloConfig): DocumentFragment {
  const frag = document.createDocumentFragment()
  frag.append(cabecalho({ titulo: modulo.nomeCurto, etiqueta: 'BÔNUS', detalhe: '• bloqueado', voltarPara: 'home' }))

  const faixa = h('div', { cls: `secao-band ${modulo.cor}` },
    h('div', { cls: 'secao-band-row' },
      h('span', { cls: 'secao-band-ico', html: svg(modulo.icone) }),
      h('div', null,
        h('h2', { cls: 'secao-band-nome' }, modulo.nome),
        h('p', { cls: 'secao-band-resumo' }, `Bloqueado · ${modulo.preco}`),
      ),
    ),
  )

  const itens = h('ul', { cls: 'bullet-list' },
    ...modulo.exemplos.map((e) => h('li', { cls: 'bullet-item' }, h('span', { cls: 'bullet-dot' }), h('span', null, e))),
  )

  const mensagem = h('div', { cls: 'cda-msg erro cda-oculto', role: 'alert' })
  const suporte = h('a', { cls: 'cda-btn zap cda-oculto', href: linkSuporte(), target: '_blank', rel: 'noopener noreferrer' })
  suporte.innerHTML = `${svg(ICONES.chat)}Falar com o suporte`

  const campo = h('input', { cls: 'cda-input', id: 'cda-senha', type: 'text', autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false', placeholder: 'Digite a senha', 'aria-label': 'Senha' })
  const liberar = h('button', { cls: 'cda-btn pri', type: 'submit' }, 'Liberar acesso')
  const formulario = h('form', { cls: 'cda-form cda-oculto', novalidate: true },
    h('label', { for: 'cda-senha' }, 'Senha recebida na compra'),
    campo, liberar, mensagem, suporte,
  )
  formulario.addEventListener('submit', (ev) => {
    ev.preventDefault()
    if (ctx.desbloqueio.tentarSenha(modulo.id, campo.value)) {
      mostrarAviso(`Liberado: ${modulo.nomeCurto}`)
      ctx.irPara(modulo.rota)
      return
    }
    mensagem.textContent = MSG_SENHA_INCORRETA
    mensagem.classList.remove('cda-oculto')
    suporte.classList.remove('cda-oculto')
    campo.focus()
    campo.select()
  })

  const comprar = h('a', { cls: 'cda-btn pri', href: modulo.checkoutUrl, target: '_blank', rel: 'noopener noreferrer' }, `Desbloquear por ${modulo.preco}`)
  const jaComprei = h('button', { cls: 'cda-btn sec', type: 'button' })
  jaComprei.innerHTML = `${svg(ICONES.chave)}Já comprei: digitar senha`
  jaComprei.addEventListener('click', () => {
    formulario.classList.toggle('cda-oculto')
    if (!formulario.classList.contains('cda-oculto')) campo.focus()
  })

  const page = h('div', { cls: 'page' },
    faixa,
    h('p', { cls: 'secao-desc' }, modulo.descricao),
    h('h2', { cls: 'bloco-titulo' }, 'O que você vai receber'),
    itens,
    h('div', { cls: 'cda-acoes' }, comprar, jaComprei, formulario),
  )
  frag.append(page)
  return frag
}

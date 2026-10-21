import { linkSuporte } from '../config/suporte'
import { mostrarAviso } from './aviso'
import { cabecalho } from './cabecalho'
import type { Contexto } from './contexto'
import { h, svg, ICONES } from './dom'
import { MSG_SENHA_INCORRETA } from './bloqueado'

/** Configurações: módulos desbloqueados e o campo "Tenho uma senha". */
export function renderConfiguracoes(ctx: Contexto): DocumentFragment {
  const frag = document.createDocumentFragment()
  frag.append(cabecalho({ titulo: 'Configurações', etiqueta: 'AJUSTES', voltarPara: 'home' }))

  const linhas = ctx.modulos.map((m) => {
    const liberado = ctx.desbloqueio.estaDesbloqueado(m.id)
    const estado = liberado
      ? h('span', { cls: 'cda-liberado', html: `${svg(ICONES.cadeadoAberto)}Desbloqueado` })
      : h('span', { cls: 'cda-preco', html: `${svg(ICONES.cadeado)}Bloqueado · ${m.preco}` })
    const linha = h('button', { cls: 'cda-linha', 'data-modulo': m.id },
      h('span', { cls: `cda-linha-ico ${m.cor}`, html: svg(m.icone) }),
      h('span', { cls: 'cda-linha-txt' }, h('span', { cls: 'cda-linha-nome' }, m.nome), estado),
    )
    linha.addEventListener('click', () => ctx.irPara(m.rota))
    return linha
  })

  const mensagem = h('div', { cls: 'cda-msg cda-oculto', role: 'status' })
  const suporte = h('a', { cls: 'cda-btn zap cda-oculto', href: linkSuporte(), target: '_blank', rel: 'noopener noreferrer' })
  suporte.innerHTML = `${svg(ICONES.chat)}Falar com o suporte`
  const campo = h('input', { cls: 'cda-input', id: 'cda-senha-config', type: 'text', autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false', placeholder: 'Digite a senha', 'aria-label': 'Tenho uma senha' })
  const formulario = h('form', { cls: 'cda-form', novalidate: true },
    h('label', { for: 'cda-senha-config' }, 'Tenho uma senha'),
    campo,
    h('button', { cls: 'cda-btn pri', type: 'submit' }, 'Liberar acesso'),
    mensagem, suporte,
  )
  formulario.addEventListener('submit', (ev) => {
    ev.preventDefault()
    const liberados = ctx.desbloqueio.tentarSenhaEmTodos(campo.value)
    if (liberados.length > 0) {
      mostrarAviso(`Liberado: ${liberados.map((m) => m.nomeCurto).join(', ')}`)
      ctx.renderizar()
      return
    }
    mensagem.className = 'cda-msg erro'
    mensagem.textContent = MSG_SENHA_INCORRETA
    suporte.classList.remove('cda-oculto')
  })

  frag.append(
    h('div', { cls: 'page' },
      h('h2', { cls: 'bloco-titulo' }, 'Módulos desbloqueados'),
      h('p', { cls: 'bloco-sub' }, 'O desbloqueio fica salvo neste aparelho. Em outro aparelho, digite a senha de novo.'),
      h('div', { cls: 'cda-lista' }, ...linhas),
      h('h2', { cls: 'bloco-titulo' }, 'Desbloquear com senha'),
      formulario,
    ),
  )
  return frag
}

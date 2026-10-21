import { describe, expect, it, vi } from 'vitest'
import { TREINO_CASA } from '../src/data/treinoCasa'
import { compartilharExercicio, textoParaCompartilhar } from '../src/lib/compartilhar'

const ex = TREINO_CASA[0]

describe('texto para compartilhar com o aluno', () => {
  const texto = textoParaCompartilhar(ex)

  it('traz nome, objetivo, material com volume e variações', () => {
    expect(texto).toContain(`*${ex.nome}*`)
    expect(texto).toContain(ex.objetivo)
    // formato pedido: "Material: bola e parede | 3 × 12"
    expect(texto).toContain('Material: bola e parede | 3 × 20')
    expect(texto).not.toMatch(/Séries\/tempo/)
    expect(texto).toContain(ex.variacaoFacil)
    expect(texto).toContain(ex.variacaoDificil)
  })

  it('numera os passos', () => {
    ex.passoAPasso.forEach((p, i) => expect(texto).toContain(`${i + 1}. ${p}`))
  })
})

describe('compartilharExercicio', () => {
  it('usa navigator.share quando existe', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    const copiar = vi.fn()
    expect(await compartilharExercicio(ex, { share, copiar })).toBe('compartilhado')
    expect(share).toHaveBeenCalledWith({ title: ex.nome, text: textoParaCompartilhar(ex) })
    expect(copiar).not.toHaveBeenCalled()
  })

  it('sem navigator.share, copia o texto', async () => {
    const copiar = vi.fn().mockResolvedValue(undefined)
    expect(await compartilharExercicio(ex, { copiar })).toBe('copiado')
    expect(copiar).toHaveBeenCalledWith(textoParaCompartilhar(ex))
  })

  it('fechar a folha de compartilhar não copia nem dá erro', async () => {
    const erro = Object.assign(new Error('fechou'), { name: 'AbortError' })
    const copiar = vi.fn()
    expect(await compartilharExercicio(ex, { share: vi.fn().mockRejectedValue(erro), copiar })).toBe('cancelado')
    expect(copiar).not.toHaveBeenCalled()
  })

  it('se o share falhar por outro motivo, tenta copiar', async () => {
    const copiar = vi.fn().mockResolvedValue(undefined)
    expect(await compartilharExercicio(ex, { share: vi.fn().mockRejectedValue(new Error('x')), copiar })).toBe('copiado')
  })

  it('sem share e sem área de transferência, avisa que falhou', async () => {
    expect(await compartilharExercicio(ex, {})).toBe('falhou')
    expect(await compartilharExercicio(ex, { copiar: vi.fn().mockRejectedValue(new Error('x')) })).toBe('falhou')
  })
})

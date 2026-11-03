/**
 * Caixa branca · src/lib/textos.ts
 * RF06 e RF14: a lista única de textos editáveis.
 * Os objetos do site são módulos com estado; cada teste importa do zero.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

beforeEach(() => vi.resetModules())

const carregar = async () => {
  const textos = await import('../../src/lib/textos')
  const site = await import('../../src/content/site')
  return { ...textos, site }
}

describe('lista de campos', () => {
  it('chaves únicas e estáveis', async () => {
    const { CAMPOS_TEXTO } = await carregar()
    const chaves = CAMPOS_TEXTO.map((c) => c.chave)
    expect(new Set(chaves).size).toBe(chaves.length)
    for (const c of chaves) expect(c).toMatch(/^[a-zA-Z]+(\.[a-zA-Z0-9]+)+$/)
  })

  it('cobre todas as seções fixas do site', async () => {
    const { CAMPOS_TEXTO } = await carregar()
    const secoes = new Set(CAMPOS_TEXTO.map((c) => c.secao))
    for (const s of ['Abertura', 'Quem somos', 'Nossa história', 'Onde a gente chega', 'Como ajudar', 'Rodapé']) {
      expect(secoes).toContain(s)
    }
  })

  it('o texto original de todo campo cabe no limite do próprio campo', async () => {
    const { CAMPOS_TEXTO } = await carregar()
    for (const c of CAMPOS_TEXTO.filter((c) => c.tipo !== 'foto')) {
      const v = c.ler() as string
      expect(v.length, c.chave).toBeLessThanOrEqual(c.max)
      if (c.tipo === 'linhas' && c.linhas) expect(v.split('\n').length, c.chave).toBeLessThanOrEqual(c.linhas)
    }
  })
})

describe('aplicarTextos', () => {
  it('troca o título da abertura, linha a linha', async () => {
    const { aplicarTextos, site } = await carregar()
    aplicarTextos({ 'hero.titulo': 'Linha um\n  Linha |dois|  \n\n' })
    expect(site.HERO.titulo).toEqual(['Linha um', 'Linha |dois|'])
  })

  it('troca textos aninhados (pilares, como ajudar)', async () => {
    const { aplicarTextos, site } = await carregar()
    aplicarTextos({ 'quemSomos.pilar1.rotulo': 'Sonho', 'ajudar.doar.texto': 'Doe já.' })
    expect(site.QUEM_SOMOS.pilares[1].rotulo).toBe('Sonho')
    expect(site.AJUDAR.doar.texto).toBe('Doe já.')
  })

  it('troca a foto da abertura sem mexer no catálogo de fotos', async () => {
    const { aplicarTextos, site } = await carregar()
    const { FOTOS } = await import('../../src/content/fotos')
    const nova = { src: '/api/midias/9', alt: 'Nova', largura: 800, altura: 1000 }
    aplicarTextos({ 'hero.foto': nova })
    expect(site.FOTO_HERO).toMatchObject(nova)
    expect(FOTOS.heroMenino.src).toBe('/assets/fotos/hero-menino-mochila.jpg')
  })

  it('ignora chave desconhecida, texto vazio e foto que não é objeto', async () => {
    const { aplicarTextos, site } = await carregar()
    const antes = JSON.stringify([site.HERO, site.FOOTER])
    aplicarTextos({ 'hero.inexistente': 'x', 'hero.subtitulo': '   ', 'footer.foto': '12', __proto__: 'x' })
    expect(JSON.stringify([site.HERO, site.FOOTER])).toBe(antes)
  })

  it('todo campo de texto aceita o próprio valor de volta (ida e volta)', async () => {
    const { CAMPOS_TEXTO, aplicarTextos } = await carregar()
    const originais = Object.fromEntries(CAMPOS_TEXTO.filter((c) => c.tipo !== 'foto').map((c) => [c.chave, c.ler()]))
    aplicarTextos(originais)
    for (const [k, v] of Object.entries(originais)) {
      expect(CAMPOS_TEXTO.find((c) => c.chave === k)!.ler(), k).toBe(v)
    }
  })
})

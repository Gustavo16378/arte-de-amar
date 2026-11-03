/**
 * Caixa branca · src/lib/conteudo-remoto.ts
 * RF01, RF02, RF03, RF05, RF07 e RNF15: como o site lê a API e quando cai
 * no conteúdo de reserva.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const foto = (id: number) => ({ src: `/api/midias/${id}`, alt: `foto ${id}`, largura: 800, altura: 1000 })

const resposta = {
  projetos: [
    { nome: 'P1', objetivo: 'o', objetivoCurto: 'o', publico: 'p', status: 'Em andamento', foto: foto(1), meta: [1, 2, 'x'], depoimento: '', autor: '', videoUrl: null },
    { nome: 'Sem foto', objetivo: 'o', objetivoCurto: 'o', publico: 'p', status: 'Concluído', foto: null, meta: null, depoimento: '', autor: '', videoUrl: null },
  ],
  marcos: [
    { ano: '2015', titulo: 'A', texto: 't', textoDesktop: 'td', foto: foto(2), soDesktop: false },
    { ano: '2016', titulo: 'B', texto: 't', textoDesktop: 'td', foto: foto(3), soDesktop: false },
    { ano: 'Hoje', titulo: 'C', texto: 't', textoDesktop: 'td', foto: foto(4), soDesktop: true },
  ],
  membros: [{ nome: 'Aline', cargo: 'Presidente', foto: null }],
  numeros: [{ valor: 9, sufixo: '+', label: 'anos' }],
  config: { whatsapp: '5563988887777', pix: 'pix@ong.org' },
  textos: { 'hero.subtitulo': 'Subtítulo vindo do banco' },
}

const responder = (corpo: unknown, status = 200) =>
  vi.fn(async () => new Response(JSON.stringify(corpo), { status, headers: { 'Content-Type': 'application/json' } }))

let modulo: typeof import('../../src/lib/conteudo-remoto')
let conteudo: {
  projetos: typeof import('../../src/content/projetos')
  marcos: typeof import('../../src/content/marcos')
  membros: typeof import('../../src/content/membros')
  site: typeof import('../../src/content/site')
}

beforeEach(async () => {
  vi.resetModules()
  modulo = await import('../../src/lib/conteudo-remoto')
  conteudo = {
    projetos: await import('../../src/content/projetos'),
    marcos: await import('../../src/content/marcos'),
    membros: await import('../../src/content/membros'),
    site: await import('../../src/content/site'),
  }
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('RF01 · conteúdo da API substitui o do código', () => {
  it('aplica as listas no lugar (mesma referência importada pelos componentes)', async () => {
    const ref = conteudo.projetos.PROJETOS
    vi.stubGlobal('fetch', responder(resposta))
    expect(await modulo.carregarConteudo()).toBe(true)
    expect(conteudo.projetos.PROJETOS).toBe(ref)
    expect(ref.map((p) => p.nome)).toEqual(['P1'])
    expect(conteudo.membros.MEMBROS[0].nome).toBe('Aline')
    expect(conteudo.site.NUMEROS[0]).toMatchObject({ valor: 9, sufixo: '+' })
  })

  it('projeto ou marco sem foto é descartado (o card precisa de foto)', async () => {
    vi.stubGlobal('fetch', responder(resposta))
    await modulo.carregarConteudo()
    expect(conteudo.projetos.PROJETOS.some((p) => p.nome === 'Sem foto')).toBe(false)
  })

  it('deriva o layout do design pela ordem: alterna acima/abaixo e A/B', async () => {
    vi.stubGlobal('fetch', responder(resposta))
    await modulo.carregarConteudo()
    expect(conteudo.marcos.MARCOS.map((m) => m.acima)).toEqual([true, false, true])
    expect(conteudo.marcos.MARCOS_MOBILE.map((m) => m.layout)).toEqual(['A', 'B'])
  })

  it('marco "só no computador" fica fora da lista do celular', async () => {
    vi.stubGlobal('fetch', responder(resposta))
    await modulo.carregarConteudo()
    expect(conteudo.marcos.MARCOS).toHaveLength(3)
    expect(conteudo.marcos.MARCOS_MOBILE.map((m) => m.ano)).toEqual(['2015', '2016'])
  })

  it('RF07 · WhatsApp e PIX vêm da configuração', async () => {
    vi.stubGlobal('fetch', responder(resposta))
    await modulo.carregarConteudo()
    expect(conteudo.site.SITE.whatsapp).toBe('https://wa.me/5563988887777')
    expect(conteudo.site.SITE.pix).toBe('pix@ong.org')
  })

  it('RF06 · aplica os textos editados', async () => {
    vi.stubGlobal('fetch', responder(resposta))
    await modulo.carregarConteudo()
    expect(conteudo.site.HERO.subtitulo).toBe('Subtítulo vindo do banco')
  })
})

describe('RF02 · tudo oculto no painel', () => {
  it('lista vazia é aceita (a seção sai do site), não cai na reserva', async () => {
    vi.stubGlobal('fetch', responder({ ...resposta, numeros: [], membros: [] }))
    expect(await modulo.carregarConteudo()).toBe(true)
    expect(conteudo.site.NUMEROS).toHaveLength(0)
    expect(conteudo.membros.MEMBROS).toHaveLength(0)
  })
})

describe('RF03 / RNF15 · conteúdo de reserva', () => {
  const reserva = () => conteudo.projetos.PROJETOS.map((p) => p.nome).join()

  it('API com erro 500: mantém o conteúdo do código', async () => {
    const antes = reserva()
    vi.stubGlobal('fetch', responder({ erro: 'x' }, 500))
    expect(await modulo.carregarConteudo()).toBe(false)
    expect(reserva()).toBe(antes)
  })

  it('rede fora do ar: mantém o conteúdo do código', async () => {
    const antes = reserva()
    vi.stubGlobal('fetch', vi.fn(async () => Promise.reject(new TypeError('offline'))))
    expect(await modulo.carregarConteudo()).toBe(false)
    expect(reserva()).toBe(antes)
  })

  it.each([null, [], { projetos: 'x' }, { ...resposta, marcos: undefined }])('resposta fora do contrato %#', async (c) => {
    const antes = reserva()
    vi.stubGlobal('fetch', responder(c))
    expect(await modulo.carregarConteudo()).toBe(false)
    expect(reserva()).toBe(antes)
  })

  it('API lenta: desiste em 2,5 s', async () => {
    vi.useFakeTimers()
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_: string, { signal }: { signal: AbortSignal }) =>
          new Promise((_r, rejeitar) => signal.addEventListener('abort', () => rejeitar(new DOMException('', 'AbortError')))),
      ),
    )
    const p = modulo.carregarConteudo()
    await vi.advanceTimersByTimeAsync(2499)
    let terminou = false
    p.then(() => (terminou = true))
    await Promise.resolve()
    expect(terminou).toBe(false)
    await vi.advanceTimersByTimeAsync(2)
    expect(await p).toBe(false)
  })
})

describe('RF04 / RF05 · envio do voluntário', () => {
  it('sucesso devolve null', async () => {
    vi.stubGlobal('fetch', responder({ ok: true }, 201))
    expect(await modulo.enviarVoluntario({ nome: 'A', whatsapp: '63999999999', como: '', site: '' })).toBeNull()
  })
  it('erro de validação devolve a mensagem para a pessoa corrigir', async () => {
    vi.stubGlobal('fetch', responder({ erro: 'Confira o número' }, 400))
    expect(await modulo.enviarVoluntario({ nome: 'A', whatsapp: '1', como: '', site: '' })).toBe('Confira o número')
  })
  it('servidor fora do ar devolve "offline" (o site abre o WhatsApp)', async () => {
    vi.stubGlobal('fetch', responder({ erro: 'x' }, 500))
    expect(await modulo.enviarVoluntario({ nome: 'A', whatsapp: '6399', como: '', site: '' })).toBe('offline')
    vi.stubGlobal('fetch', vi.fn(async () => Promise.reject(new TypeError('offline'))))
    expect(await modulo.enviarVoluntario({ nome: 'A', whatsapp: '6399', como: '', site: '' })).toBe('offline')
  })
})

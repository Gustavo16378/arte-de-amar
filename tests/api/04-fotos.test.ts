/**
 * Caixa preta + cinza · biblioteca de fotos (RF12, RNF06, RNF10).
 */
import { beforeAll, describe, expect, it } from 'vitest'
import { Midia } from '../contratos'
import { Cliente, banco, diretoria, formFoto, imagem, ultimaAuditoria } from './cliente'

let painel: Cliente
beforeAll(async () => {
  painel = await diretoria()
})

describe('RNF06 · upload', () => {
  it.each([
    ['webp', 'image/webp'],
    ['png', 'image/png'],
    ['jpeg', 'image/jpeg'],
  ] as const)('aceita %s de verdade', async (formato, tipo) => {
    const r = await painel.post('/api/admin/midias', formFoto(await imagem(formato), tipo))
    expect(r.status).toBe(201)
    expect(() => Midia.parse(r.corpo.item)).not.toThrow()
    expect(r.corpo.item).toMatchObject({ estatica: false, usos: 0 })
  })

  it('caixa cinza: o tipo gravado é o real, tirado dos bytes, não o que o navegador disse', async () => {
    const r = await painel.post('/api/admin/midias', formFoto(await imagem('png'), 'image/jpeg'))
    expect(r.status).toBe(201)
    const b = banco()
    const m = b.um<{ tipo: string; bytes: number }>('SELECT tipo, bytes FROM midias WHERE id = ?', r.corpo.item.id)
    b.fechar()
    expect(m.tipo).toBe('image/png')
    expect(m.bytes).toBeGreaterThan(0)
  })

  it.each([
    ['texto disfarçado de JPEG', new TextEncoder().encode('<?php system($_GET["c"]); ?>'), 'image/jpeg', 415],
    ['SVG (pode carregar script)', new TextEncoder().encode('<svg onload="alert(1)"></svg>'), 'image/svg+xml', 415],
    ['arquivo maior que 1,5 MB', new Uint8Array(1_600_000).fill(0xff), 'image/jpeg', 413],
  ])('recusa %s', async (_, bytes, tipo, status) => {
    const r = await painel.post('/api/admin/midias', formFoto(bytes, tipo))
    expect(r.status).toBe(status)
    expect(r.corpo.erro).toBeTruthy()
  })

  it.each([
    ['sem descrição', { alt: '' }],
    ['dimensões zeradas', { largura: 0 }],
    ['dimensões absurdas', { altura: 99999 }],
  ])('recusa %s', async (_, troca) => {
    const t = { alt: 'Foto válida', largura: 40, altura: 30, ...troca }
    const r = await painel.post('/api/admin/midias', formFoto(await imagem('webp'), 'image/webp', t.alt, t.largura, t.altura))
    expect(r.status).toBe(400)
  })

  it('sem arquivo → 400; corpo que não é formulário → 400', async () => {
    const f = new FormData()
    f.append('alt', 'x')
    expect((await painel.post('/api/admin/midias', f)).status).toBe(400)
    expect((await painel.post('/api/admin/midias', { arquivo: 'x' })).status).toBe(400)
  })
})

describe('RF12 · servir, baixar, editar e apagar', () => {
  let id: number

  it('a foto enviada é servida com tipo certo, nosniff e cache longo', async () => {
    const bytes = await imagem('webp', 50, 50)
    const r = await painel.post('/api/admin/midias', formFoto(bytes, 'image/webp', 'Crianças na Ação de Páscoa', 50, 50))
    id = r.corpo.item.id
    const f = await fetch(`${(await import('./cliente')).URL_BASE}/api/midias/${id}`)
    expect(f.status).toBe(200)
    expect(f.headers.get('content-type')).toBe('image/webp')
    expect(f.headers.get('x-content-type-options')).toBe('nosniff')
    expect(f.headers.get('cache-control')).toContain('immutable')
    expect(new Uint8Array(await f.arrayBuffer())).toEqual(bytes)
  })

  it('?baixar=1 entrega como download com nome legível', async () => {
    const f = await fetch(`${(await import('./cliente')).URL_BASE}/api/midias/${id}?baixar=1`)
    expect(f.headers.get('content-disposition')).toBe(`attachment; filename="criancas-na-acao-de-pascoa-${id}.webp"`)
  })

  it('corrige a descrição', async () => {
    expect((await painel.put(`/api/admin/midias/${id}`, { alt: 'Nova descrição' })).status).toBe(200)
    expect(ultimaAuditoria()).toMatchObject({ area: 'fotos', acao: 'editou', alvo: 'Nova descrição' })
  })

  it('RNF10 · foto em uso por projeto não pode ser apagada', async () => {
    const p = await painel.post('/api/admin/projetos', {
      nome: 'Usa a foto',
      objetivo: 'x',
      objetivo_curto: 'x',
      publico: 'x',
      status: 'Concluído',
      foto_id: id,
    })
    const lista = (await painel.get('/api/admin/midias')).corpo.itens
    expect(lista.find((m: { id: number }) => m.id === id).usos).toBe(1)
    const r = await painel.del(`/api/admin/midias/${id}`)
    expect(r.status).toBe(409)
    expect(r.corpo.erro).toMatch(/em uso/)
    await painel.del(`/api/admin/projetos/${p.corpo.item.id}`)
  })

  it('foto em uso nos textos do site também é protegida', async () => {
    await painel.put('/api/admin/textos', { valores: { 'footer.foto': String(id) } })
    expect((await painel.del(`/api/admin/midias/${id}`)).status).toBe(409)
    await painel.put('/api/admin/textos', { valores: { 'footer.foto': null } })
  })

  it('foto do site original não pode ser apagada pelo painel', async () => {
    expect((await painel.del('/api/admin/midias/1')).status).toBe(409)
  })

  it('sem uso, apaga; o retrato da diretoria que usava fica vazio (não apaga a pessoa)', async () => {
    const m = await painel.post('/api/admin/membros', { nome: 'Com retrato', cargo: 'Teste', foto_id: id })
    expect((await painel.del(`/api/admin/midias/${id}`)).status).toBe(200)
    const pessoa = (await painel.get('/api/admin/membros')).corpo.itens.find((x: { id: number }) => x.id === m.corpo.item.id)
    expect(pessoa.foto_id).toBeNull()
    expect((await fetch(`${(await import('./cliente')).URL_BASE}/api/midias/${id}`)).status).toBe(404)
    await painel.del(`/api/admin/membros/${m.corpo.item.id}`)
  })
})

/**
 * Caixa preta + cinza · CRUD do painel refletindo no site (RF01, RF02, RF11,
 * RF19, RNF05, RNF09, RNF10).
 */
import { beforeAll, describe, expect, it } from 'vitest'
import { ProjetoAdmin } from '../contratos'
import { Cliente, banco, diretoria, ultimaAuditoria } from './cliente'

let painel: Cliente
const site = new Cliente()
const nomesNoSite = async () => (await site.get('/api/conteudo')).corpo.projetos.map((p: { nome: string }) => p.nome)

const novo = {
  nome: 'Campanha do Agasalho',
  objetivo: 'Casacos e cobertores para o inverno.',
  objetivo_curto: 'Casacos para o inverno.',
  publico: 'Famílias',
  status: 'Em andamento',
  foto_id: 2,
  meta_feito: 10,
  meta_total: 100,
  meta_unidade: 'casacos',
}
let id: number

beforeAll(async () => {
  painel = await diretoria()
})

describe('RF11 · projetos', () => {
  it('lista no contrato do painel, com url da foto', async () => {
    const r = await painel.get('/api/admin/projetos')
    expect(r.status).toBe(200)
    for (const p of r.corpo.itens) expect(() => ProjetoAdmin.parse(p)).not.toThrow()
  })

  it('cria no fim da lista e aparece no site na hora (RF01)', async () => {
    const r = await painel.post('/api/admin/projetos', novo)
    expect(r.status).toBe(201)
    id = r.corpo.item.id
    expect(r.corpo.item.versao).toBe(0)
    expect((await nomesNoSite()).at(-1)).toBe('Campanha do Agasalho')
  })

  it('RF19 · caixa cinza: a criação foi para a auditoria com o nome de quem fez', () => {
    expect(ultimaAuditoria()).toMatchObject({ usuario_nome: 'Diretoria Teste', acao: 'criou', area: 'projetos', alvo: 'Campanha do Agasalho' })
  })

  it('edita só o que foi mandado e sobe a versão', async () => {
    const r = await painel.put(`/api/admin/projetos/${id}`, { meta_feito: 40, versao: 0 })
    expect(r.status).toBe(200)
    expect(r.corpo.item).toMatchObject({ meta_feito: 40, meta_total: 100, nome: 'Campanha do Agasalho', versao: 1 })
    const meta = (await site.get('/api/conteudo')).corpo.projetos.find((p: { nome: string }) => p.nome === novo.nome).meta
    expect(meta).toEqual([40, 100, 'casacos'])
    expect(ultimaAuditoria()).toMatchObject({ acao: 'editou', detalhe: 'Meta: quanto já foi feito' })
  })

  it('RF02 · oculto sai do site, volta quando reativado', async () => {
    await painel.put(`/api/admin/projetos/${id}`, { visivel: 0 })
    expect(await nomesNoSite()).not.toContain(novo.nome)
    expect(ultimaAuditoria().detalhe).toBe('escondeu do site')
    await painel.put(`/api/admin/projetos/${id}`, { visivel: 1 })
    expect(await nomesNoSite()).toContain(novo.nome)
  })

  it('reordena e o site segue a nova ordem', async () => {
    const ids = (await painel.get('/api/admin/projetos')).corpo.itens.map((p: { id: number }) => p.id)
    const invertida = [...ids].reverse()
    expect((await painel.put('/api/admin/projetos/ordem', { ids: invertida })).status).toBe(200)
    expect((await nomesNoSite())[0]).toBe(novo.nome)
    expect((await painel.put('/api/admin/projetos/ordem', { ids })).status).toBe(200)
  })

  it.each([
    [{ ids: 'x' }],
    [{ ids: [1, 1] }],
    [{ ids: [1, -2] }],
  ])('ordem inválida %o → 400', async (corpo) => {
    expect((await painel.put('/api/admin/projetos/ordem', corpo)).status).toBe(400)
  })

  it('apaga e some do site; apagar de novo dá 404', async () => {
    expect((await painel.del(`/api/admin/projetos/${id}`)).status).toBe(200)
    expect(await nomesNoSite()).not.toContain(novo.nome)
    expect(ultimaAuditoria()).toMatchObject({ acao: 'apagou', alvo: 'Campanha do Agasalho' })
    expect((await painel.del(`/api/admin/projetos/${id}`)).status).toBe(404)
    expect((await painel.put(`/api/admin/projetos/${id}`, { nome: 'x' })).status).toBe(404)
  })
})

describe('RNF10 · validação na API', () => {
  it.each([
    ['sem nome', { ...novo, nome: '' }, /Nome/],
    ['status inválido', { ...novo, status: 'Talvez' }, /Status/],
    ['meta pela metade', { ...novo, meta_total: null }, /três campos/],
    ['foto inexistente', { ...novo, foto_id: 99999 }, /não existe mais/],
    ['vídeo sem https', { ...novo, video_url: 'http://x.com' }, /https/],
    ['nome gigante', { ...novo, nome: 'x'.repeat(500) }, /80 caracteres/],
  ])('%s → 400 com mensagem em português', async (_, corpo, mensagem) => {
    const r = await painel.post('/api/admin/projetos', corpo)
    expect(r.status).toBe(400)
    expect(r.corpo.erro).toMatch(mensagem)
  })

  it('caixa cinza: nada inválido chegou ao banco', () => {
    const b = banco()
    const n = b.um<{ n: number }>(`SELECT COUNT(*) AS n FROM projetos WHERE nome IN ('', 'xxxxxxxx') OR status = 'Talvez'`)
    b.fechar()
    expect(n.n).toBe(0)
  })
})

describe('RNF05 · rotas fora da lista fechada', () => {
  it.each(['usuarios', 'midias%3B', 'projetos%20OR%201%3D1', 'sqlite_master', 'tentativas'])(
    '/api/admin/%s não vira consulta',
    async (nome) => {
      const r = await painel.get(`/api/admin/${nome}`)
      // usuarios é rota própria (lista de pessoas); o resto é 404
      if (nome === 'usuarios') expect(r.status).toBe(200)
      else expect(r.status).toBe(404)
    },
  )

  it('id com injeção de SQL é 404, sem erro de banco', async () => {
    const r = await painel.put('/api/admin/projetos/1%20OR%201=1', { nome: 'x' })
    expect(r.status).toBe(404)
  })
})

describe('RF11 · marcos, diretoria e números', () => {
  it('cria marco, aparece na linha do tempo; "só no computador" fica fora do celular', async () => {
    const r = await painel.post('/api/admin/marcos', {
      ano: '2026',
      titulo: 'Site novo',
      texto: 'A ONG ganha site e painel.',
      texto_desktop: 'A ONG ganha site próprio e painel para cuidar dele.',
      foto_id: 1,
      so_desktop: 1,
    })
    expect(r.status).toBe(201)
    const marco = (await site.get('/api/conteudo')).corpo.marcos.find((m: { ano: string }) => m.ano === '2026')
    expect(marco).toMatchObject({ titulo: 'Site novo', soDesktop: true })
    await painel.del(`/api/admin/marcos/${r.corpo.item.id}`)
  })

  it('pessoa da diretoria sem retrato é aceita e aparece com foto null', async () => {
    const r = await painel.post('/api/admin/membros', { nome: 'Pessoa Nova', cargo: 'Conselho fiscal' })
    expect(r.status).toBe(201)
    const m = (await site.get('/api/conteudo')).corpo.membros.find((x: { nome: string }) => x.nome === 'Pessoa Nova')
    expect(m.foto).toBeNull()
    await painel.del(`/api/admin/membros/${r.corpo.item.id}`)
  })

  it('RF02 · tudo oculto em números: a lista do site vem vazia (e o site esconde a seção)', async () => {
    const itens = (await painel.get('/api/admin/numeros')).corpo.itens
    for (const n of itens) await painel.put(`/api/admin/numeros/${n.id}`, { visivel: 0 })
    expect((await site.get('/api/conteudo')).corpo.numeros).toEqual([])
    for (const n of itens) await painel.put(`/api/admin/numeros/${n.id}`, { visivel: 1 })
    expect((await site.get('/api/conteudo')).corpo.numeros).toHaveLength(itens.length)
  })
})

describe('RF16 · configurações', () => {
  it('troca WhatsApp (completa o 55) e o site usa o novo', async () => {
    const antes = (await painel.get('/api/admin/configuracoes')).corpo.config
    expect((await painel.put('/api/admin/configuracoes', { whatsapp: '(63) 98888-7777' })).status).toBe(200)
    expect((await site.get('/api/conteudo')).corpo.config.whatsapp).toBe('5563988887777')
    expect(ultimaAuditoria()).toMatchObject({ area: 'configuracoes', detalhe: 'WhatsApp' })
    await painel.put('/api/admin/configuracoes', { whatsapp: antes.whatsapp })
  })

  it.each([{ whatsapp: '123' }, { pix: 'a' }, {}])('valor inválido %o → 400', async (corpo) => {
    expect((await painel.put('/api/admin/configuracoes', corpo)).status).toBe(400)
  })
})

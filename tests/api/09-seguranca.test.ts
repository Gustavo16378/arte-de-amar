/**
 * Caixa preta · ataques comuns (RNF03, RNF05, OWASP Top 10 no que cabe aqui).
 */
import { beforeAll, describe, expect, it } from 'vitest'
import { Cliente, URL_BASE, diretoria } from './cliente'

let painel: Cliente
beforeAll(async () => {
  painel = await diretoria()
})

describe('RNF03 · CSRF', () => {
  it.each([
    ['POST', '/api/admin/projetos'],
    ['PUT', '/api/admin/projetos/1'],
    ['DELETE', '/api/admin/voluntarios'],
    ['PUT', '/api/admin/textos'],
    ['POST', '/api/admin/usuarios'],
  ])('%s %s vindo de outro site → 403, mesmo com cookie válido', async (metodo, caminho) => {
    const r = await painel.pedir(metodo, caminho, metodo === 'DELETE' ? undefined : { nome: 'x' }, { Origin: 'https://site-malicioso.com' })
    expect(r.status).toBe(403)
  })

  it('a mesma origem passa', async () => {
    const r = await painel.pedir('PUT', '/api/admin/configuracoes', { pix: '40.019.106/0001-51' }, { Origin: URL_BASE })
    expect(r.status).toBe(200)
  })
})

describe('XSS armazenado', () => {
  it('HTML num texto é guardado e devolvido como texto puro (o React escapa na tela; ver E2E)', async () => {
    const ataque = '<img src=x onerror=alert(1)> |amar|'
    expect((await painel.put('/api/admin/textos', { valores: { 'historia.titulo': ataque } })).status).toBe(200)
    const { textos } = (await new Cliente().get('/api/conteudo')).corpo
    expect(textos['historia.titulo']).toBe(ataque)
    await painel.put('/api/admin/textos', { valores: { 'historia.titulo': null } })
  })
})

describe('abuso de entrada', () => {
  it('JSON grande demais → 413', async () => {
    const r = await painel.put('/api/admin/textos', { valores: { 'hero.subtitulo': 'x'.repeat(40_000) } })
    expect(r.status).toBe(413)
  })

  it('Content-Type errado → 415', async () => {
    const r = await painel.pedir('POST', '/api/admin/projetos', undefined, { 'Content-Type': 'text/plain' })
    expect(r.status).toBe(415)
  })

  it('prototype pollution no corpo não vira campo', async () => {
    const r = await painel.pedir(
      'PUT',
      '/api/admin/configuracoes',
      undefined,
      {},
    )
    expect(r.status).toBe(415)
    const corpo = '{"__proto__":{"admin":true},"pix":"40.019.106/0001-51"}'
    const f = await fetch(`${URL_BASE}/api/admin/configuracoes`, {
      method: 'PUT',
      headers: { Cookie: painel.cookie, 'Content-Type': 'application/json' },
      body: corpo,
    })
    expect(f.status).toBe(200)
    expect(({} as Record<string, unknown>).admin).toBeUndefined()
  })

  it('método não suportado → 405', async () => {
    const r = await painel.pedir('PATCH', '/api/admin/projetos/1', {})
    expect(r.status).toBe(405)
  })
})

describe('respostas não vazam detalhe interno', () => {
  it('nenhum erro menciona SQL, stack ou caminho de arquivo', async () => {
    const respostas = await Promise.all([
      painel.put('/api/admin/projetos/1', { foto_id: 'x' }),
      painel.get('/api/admin/auditoria?de=x&ate=y'),
      new Cliente().post('/api/auth/login', { email: "' OR 1=1 --", senha: "' OR 1=1 --" }),
    ])
    for (const r of respostas) {
      expect(JSON.stringify(r.corpo)).not.toMatch(/SQLITE|D1_|at .*\.ts|functions\//i)
    }
  })
})

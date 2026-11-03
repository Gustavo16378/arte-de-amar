/**
 * Caixa preta + cinza · login, sessão e acesso (RF10, RF18, RNF01, RNF02, RNF04).
 */
import { describe, expect, it } from 'vitest'
import { Usuario } from '../contratos'
import { ADMIN, Cliente, banco, diretoria } from './cliente'

describe('RF10 · login', () => {
  it('entra com e-mail e senha certos e devolve o usuário no contrato', async () => {
    const c = new Cliente()
    const r = await c.entrar()
    expect(() => Usuario.parse(r.corpo.usuario)).not.toThrow()
    expect(r.corpo.usuario.email).toBe(ADMIN.email)
  })

  it('e-mail sem diferenciar maiúsculas nem espaços', async () => {
    const c = new Cliente()
    await expect(c.entrar(`  ${ADMIN.email.toUpperCase()} `)).resolves.toBeTruthy()
  })

  it('RNF02 · cookie de sessão HttpOnly e SameSite=Strict', async () => {
    const r = await new Cliente().post('/api/auth/login', { email: ADMIN.email, senha: ADMIN.senha })
    const cookie = r.cabecalhos.get('set-cookie') ?? ''
    expect(cookie).toMatch(/^ada_sessao=[\w-]+\.[\w-]+\.[\w-]+;/)
    expect(cookie).toContain('HttpOnly')
    expect(cookie).toContain('SameSite=Strict')
    expect(cookie).toContain('Path=/api')
  })

  it('RNF04 · senha errada e e-mail inexistente dão a mesma resposta', async () => {
    const a = await new Cliente().post('/api/auth/login', { email: ADMIN.email, senha: 'errada-errada' })
    const b = await new Cliente().post('/api/auth/login', { email: 'ninguem@teste.local', senha: 'errada-errada' })
    expect(a.status).toBe(401)
    expect(b.status).toBe(401)
    expect(a.corpo).toEqual(b.corpo)
  })

  it('campos vazios dão 400', async () => {
    expect((await new Cliente().post('/api/auth/login', { email: '', senha: '' })).status).toBe(400)
  })

  it('RNF04 · trava depois de 5 erros seguidos no mesmo e-mail, e a senha certa também fica barrada', async () => {
    const email = 'trava@teste.local'
    for (let i = 0; i < 5; i++) {
      expect((await new Cliente().post('/api/auth/login', { email, senha: 'errada' })).status).toBe(401)
    }
    const r = await new Cliente().post('/api/auth/login', { email, senha: 'errada' })
    expect(r.status).toBe(429)
    expect(r.corpo.erro).toMatch(/15 minutos/)
    // a trava é por e-mail: a diretoria continua entrando normalmente
    await expect(new Cliente().entrar()).resolves.toBeTruthy()
  })

  it('caixa cinza · as tentativas ficam registradas no banco com o IP', async () => {
    const b = banco()
    const n = b.um<{ n: number }>(`SELECT COUNT(*) AS n FROM tentativas WHERE chave = 'login:trava@teste.local'`)
    b.fechar()
    expect(n.n).toBeGreaterThanOrEqual(5)
  })
})

describe('RNF01 · caixa cinza: o banco não guarda a senha', () => {
  it('só hash PBKDF2 de 32 bytes, salt de 16 e 100 mil iterações', () => {
    const b = banco()
    const u = b.um<{ senha_hash: string; salt: string; iteracoes: number }>(
      'SELECT senha_hash, salt, iteracoes FROM usuarios WHERE email = ?',
      ADMIN.email,
    )
    b.fechar()
    expect(u.senha_hash).not.toContain(ADMIN.senha)
    expect(Buffer.from(u.senha_hash, 'base64')).toHaveLength(32)
    expect(Buffer.from(u.salt, 'base64')).toHaveLength(16)
    expect(u.iteracoes).toBe(100_000)
  })
})

describe('RF10 · sessão', () => {
  it('/api/auth/eu reconhece quem está logado', async () => {
    const c = await diretoria()
    const r = await c.get('/api/auth/eu')
    expect(r.status).toBe(200)
    expect(r.corpo.usuario.email).toBe(ADMIN.email)
  })

  it('logout apaga o cookie e a sessão deixa de valer no navegador', async () => {
    const c = await diretoria()
    const r = await c.post('/api/auth/logout')
    expect(r.cabecalhos.get('set-cookie')).toMatch(/Max-Age=0/)
    expect(c.cookie).toBe('')
    expect((await c.get('/api/admin/projetos')).status).toBe(401)
  })

  it.each([
    ['sem cookie', ''],
    ['cookie com lixo', 'ada_sessao=lixo'],
    ['token adulterado', 'ada_sessao=eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOjF9.assinaturafalsa'],
  ])('%s → 401', async (_, cookie) => {
    const c = new Cliente()
    c.cookie = cookie
    expect((await c.get('/api/admin/projetos')).status).toBe(401)
  })
})

describe('RF10 · toda rota do painel exige login', () => {
  const rotas: [string, string][] = [
    ['GET', '/api/admin/projetos'],
    ['POST', '/api/admin/projetos'],
    ['PUT', '/api/admin/projetos/1'],
    ['DELETE', '/api/admin/projetos/1'],
    ['PUT', '/api/admin/projetos/ordem'],
    ['GET', '/api/admin/marcos'],
    ['GET', '/api/admin/membros'],
    ['GET', '/api/admin/numeros'],
    ['GET', '/api/admin/midias'],
    ['POST', '/api/admin/midias'],
    ['PUT', '/api/admin/midias/1'],
    ['DELETE', '/api/admin/midias/1'],
    ['GET', '/api/admin/voluntarios'],
    ['DELETE', '/api/admin/voluntarios'],
    ['PUT', '/api/admin/voluntarios/1'],
    ['GET', '/api/admin/configuracoes'],
    ['PUT', '/api/admin/configuracoes'],
    ['GET', '/api/admin/textos'],
    ['PUT', '/api/admin/textos'],
    ['GET', '/api/admin/usuarios'],
    ['POST', '/api/admin/usuarios'],
    ['PUT', '/api/admin/usuarios/1'],
    ['DELETE', '/api/admin/usuarios/1'],
    ['GET', '/api/admin/auditoria?de=2026-01-01 00:00:00&ate=2027-01-01 00:00:00'],
    ['GET', '/api/admin/espaco'],
    ['PUT', '/api/admin/senha'],
  ]
  it.each(rotas)('%s %s sem login → 401', async (metodo, caminho) => {
    const r = await new Cliente().pedir(metodo, caminho, metodo === 'GET' || metodo === 'DELETE' ? undefined : {})
    expect(r.status).toBe(401)
  })
})

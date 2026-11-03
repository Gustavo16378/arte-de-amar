/**
 * Caixa branca · functions/_lib/auth.ts
 * RNF01 (hash de senha) e RNF02 (sessão assinada em cookie seguro).
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  ITERACOES,
  assinar,
  conferirSenha,
  cookieApagado,
  cookieDeSessao,
  gerarHash,
  lerCookie,
  verificar,
} from '../../functions/_lib/auth'
import type { Env } from '../../functions/_lib/tipos'

const env = { JWT_SECRET: 'x'.repeat(40) } as Env
const usuario = { id: 7, nome: 'Aline', email: 'aline@ong.org' }

afterEach(() => vi.useRealTimers())

describe('RNF01 · hash de senha', () => {
  it('gera hash diferente para a mesma senha (salt aleatório)', async () => {
    const a = await gerarHash('minha-senha-123')
    const b = await gerarHash('minha-senha-123')
    expect(a.hash).not.toBe(b.hash)
    expect(a.salt).not.toBe(b.salt)
    expect(a.iteracoes).toBe(ITERACOES)
  })

  it('nunca devolve a senha em texto', async () => {
    const h = await gerarHash('minha-senha-123')
    expect(JSON.stringify(h)).not.toContain('minha-senha-123')
    // 32 bytes de PBKDF2 em base64
    expect(atob(h.hash)).toHaveLength(32)
  })

  it('confere a senha certa e recusa a errada', async () => {
    const h = await gerarHash('minha-senha-123')
    expect(await conferirSenha('minha-senha-123', h.hash, h.salt, h.iteracoes)).toBe(true)
    expect(await conferirSenha('minha-senha-124', h.hash, h.salt, h.iteracoes)).toBe(false)
    expect(await conferirSenha('', h.hash, h.salt, h.iteracoes)).toBe(false)
  })

  it('respeita o número de iteracoes gravado (senhas antigas continuam válidas)', async () => {
    const h = await gerarHash('outra-senha', undefined, 1000)
    expect(await conferirSenha('outra-senha', h.hash, h.salt, 1000)).toBe(true)
    expect(await conferirSenha('outra-senha', h.hash, h.salt, ITERACOES)).toBe(false)
  })

  it('é compatível com o PBKDF2 do Node usado em scripts/criar-admin.mjs', async () => {
    const { pbkdf2Sync } = await import('node:crypto')
    const salt = new Uint8Array(16).fill(3)
    const node = pbkdf2Sync('senha-do-script', salt, ITERACOES, 32, 'sha256').toString('base64')
    const api = await gerarHash('senha-do-script', salt)
    expect(api.hash).toBe(node)
  })
})

describe('RNF02 · sessão JWT', () => {
  it('assina e verifica um token válido', async () => {
    const token = await assinar(env, usuario)
    expect(token.split('.')).toHaveLength(3)
    const carga = await verificar(env, token)
    expect(carga).toMatchObject({ sub: 7, nome: 'Aline', email: 'aline@ong.org' })
  })

  it('recusa token com a carga adulterada', async () => {
    const [cab, , ass] = (await assinar(env, usuario)).split('.')
    const falsa = btoa(JSON.stringify({ sub: 1, nome: 'Invasor', email: 'x', exp: 9e9 }))
      .replace(/=+$/, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
    expect(await verificar(env, `${cab}.${falsa}.${ass}`)).toBeNull()
  })

  it('recusa token assinado com outro segredo', async () => {
    const token = await assinar({ JWT_SECRET: 'y'.repeat(40) } as Env, usuario)
    expect(await verificar(env, token)).toBeNull()
  })

  it('recusa token expirado (8 horas)', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-03T12:00:00Z'))
    const token = await assinar(env, usuario)
    vi.setSystemTime(new Date('2026-11-03T19:59:00Z'))
    expect(await verificar(env, token)).not.toBeNull()
    vi.setSystemTime(new Date('2026-11-03T20:00:01Z'))
    expect(await verificar(env, token)).toBeNull()
  })

  it.each(['', 'abc', 'a.b', 'a.b.c.d', '###.###.###'])('recusa token malformado "%s"', async (t) => {
    expect(await verificar(env, t)).toBeNull()
  })

  it('falha alto quando o JWT_SECRET não está configurado ou é curto', async () => {
    await expect(assinar({ JWT_SECRET: '' } as Env, usuario)).rejects.toThrow(/JWT_SECRET/)
    await expect(assinar({ JWT_SECRET: 'curto' } as Env, usuario)).rejects.toThrow(/JWT_SECRET/)
  })
})

describe('RNF02 · cookie de sessão', () => {
  const https = new Request('https://arte-de-amar-site.pages.dev/api/auth/login')
  const http = new Request('http://localhost:8788/api/auth/login')

  it('é HttpOnly, SameSite=Strict, restrito a /api e Secure em HTTPS', () => {
    const c = cookieDeSessao(https, 'tok')
    expect(c).toContain('ada_sessao=tok')
    expect(c).toContain('HttpOnly')
    expect(c).toContain('SameSite=Strict')
    expect(c).toContain('Path=/api')
    expect(c).toContain('Secure')
    expect(c).toContain('Max-Age=28800')
  })

  it('não marca Secure em http://localhost, senão o navegador descartaria', () => {
    expect(cookieDeSessao(http, 'tok')).not.toContain('Secure')
  })

  it('o logout zera o cookie', () => {
    expect(cookieApagado(https)).toMatch(/ada_sessao=;.*Max-Age=0/)
  })

  it('lê o cookie certo no meio de outros', () => {
    const r = new Request('https://x', { headers: { Cookie: 'a=1; ada_sessao=abc.def.ghi; b=2' } })
    expect(lerCookie(r)).toBe('abc.def.ghi')
    expect(lerCookie(new Request('https://x'))).toBeNull()
  })
})

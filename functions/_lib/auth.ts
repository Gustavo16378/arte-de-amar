/**
 * Senhas e sessões do painel, só com a Web Crypto que o Cloudflare já tem.
 *
 * Senha: PBKDF2-SHA256 com salt aleatório por usuário. 100 mil iterações é o
 * máximo que o runtime da Cloudflare aceita.
 *
 * Sessão: um JWT HS256 assinado com JWT_SECRET, guardado num cookie
 * HttpOnly, Secure e SameSite=Strict. O JavaScript da página não enxerga o
 * token e outro site não consegue mandar o cookie junto.
 */
import { ErroHttp } from './http'
import type { Env } from './tipos'

export const ITERACOES = 100_000
const COOKIE = 'ada_sessao'
const DURACAO_S = 8 * 60 * 60

const enc = new TextEncoder()

const b64 = (buf: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(buf)))
const deB64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0))
const b64url = (buf: ArrayBuffer | Uint8Array) =>
  b64(buf).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const deB64url = (s: string) => deB64(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4))

export async function gerarHash(senha: string, salt?: Uint8Array, iteracoes = ITERACOES) {
  const sal = salt ?? crypto.getRandomValues(new Uint8Array(16))
  const chave = await crypto.subtle.importKey('raw', enc.encode(senha), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: sal, iterations: iteracoes },
    chave,
    256,
  )
  return { hash: b64(bits), salt: b64(sal), iteracoes }
}

/** comparação em tempo constante, para o tempo de resposta não entregar nada */
function iguais(a: string, b: string) {
  if (a.length !== b.length) return false
  let dif = 0
  for (let i = 0; i < a.length; i++) dif |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return dif === 0
}

export async function conferirSenha(senha: string, hash: string, salt: string, iteracoes: number) {
  const calculado = await gerarHash(senha, deB64(salt), iteracoes)
  return iguais(calculado.hash, hash)
}

function segredo(env: Env) {
  if (!env.JWT_SECRET || env.JWT_SECRET.length < 32) {
    throw new ErroHttp('JWT_SECRET não configurado no servidor.', 500)
  }
  return crypto.subtle.importKey('raw', enc.encode(env.JWT_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
    'verify',
  ])
}

type Carga = { sub: number; nome: string; email: string; exp: number }

export async function assinar(env: Env, usuario: { id: number; nome: string; email: string }) {
  const cabecalho = b64url(enc.encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })))
  const carga: Carga = {
    sub: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    exp: Math.floor(Date.now() / 1000) + DURACAO_S,
  }
  const corpo = b64url(enc.encode(JSON.stringify(carga)))
  const assinatura = await crypto.subtle.sign('HMAC', await segredo(env), enc.encode(`${cabecalho}.${corpo}`))
  return `${cabecalho}.${corpo}.${b64url(assinatura)}`
}

export async function verificar(env: Env, token: string): Promise<Carga | null> {
  const partes = token.split('.')
  if (partes.length !== 3) return null
  const [cabecalho, corpo, assinatura] = partes
  try {
    const ok = await crypto.subtle.verify(
      'HMAC',
      await segredo(env),
      deB64url(assinatura),
      enc.encode(`${cabecalho}.${corpo}`),
    )
    if (!ok) return null
    const carga = JSON.parse(new TextDecoder().decode(deB64url(corpo))) as Carga
    if (typeof carga.exp !== 'number' || carga.exp < Date.now() / 1000) return null
    return carga
  } catch {
    return null
  }
}

export function lerCookie(req: Request) {
  const cookies = req.headers.get('Cookie') ?? ''
  for (const parte of cookies.split(';')) {
    const [nome, ...resto] = parte.trim().split('=')
    if (nome === COOKIE) return resto.join('=')
  }
  return null
}

/** Em http://localhost o Secure impediria o cookie de existir. */
function seguro(req: Request) {
  return new URL(req.url).protocol === 'https:' ? '; Secure' : ''
}

export function cookieDeSessao(req: Request, token: string) {
  return `${COOKIE}=${token}; Path=/api; HttpOnly; SameSite=Strict; Max-Age=${DURACAO_S}${seguro(req)}`
}

export function cookieApagado(req: Request) {
  return `${COOKIE}=; Path=/api; HttpOnly; SameSite=Strict; Max-Age=0${seguro(req)}`
}
